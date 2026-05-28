import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Folder,
  ListPlus,
  Percent,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { useUnsavedChanges } from "../UnsavedChangesContext.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  addListItem,
  createList,
  deleteList,
  deleteListItem,
  getListDetail,
  getLists,
  updateListItem
} from "../services/listsService.js";

const listCategories = [
  "General",
  "Market Prep",
  "Shopping",
  "Production",
  "Packaging",
  "Delivery",
  "Permits",
  "Ideas",
  "Other"
];

function makeId(prefix = "list") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Lists() {
  const { user, loginWithGoogle } = useAuth();
  const { isDirty: hasUnsavedChanges, markUnsaved, markSaved } = useUnsavedChanges();

  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newItemText, setNewItemText] = useState("");

  const [newList, setNewList] = useState({
    name: "",
    category: "General",
    description: ""
  });

  function markListsDirty() {
    markUnsaved({
      source: "Lists",
      onSave: async () => {
        const saved = await saveListsDraft();

        if (!saved) {
          throw new Error("List changes could not be saved.");
        }
      }
    });
  }

  async function saveListsDraft() {
    if (isNewListOpen) {
      return handleCreateList();
    }

    if (selectedList && newItemText.trim()) {
      return handleAddItem();
    }

    markSaved();
    return true;
  }

  useEffect(() => {
    if (!statusMessage) return;

    const timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function loadLists() {
    if (!user) return;

    setLoading(true);

    try {
      const savedLists = await getLists(user.uid);
      setLists(savedLists);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not load lists.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadLists();
    } else {
      setLists([]);
      setSelectedList(null);
    }
  }, [user]);

  async function openList(listId) {
    if (!user) return;

    setLoading(true);

    try {
      const detail = await getListDetail(user.uid, listId);
      setSelectedList(detail);
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not open list.");
    } finally {
      setLoading(false);
    }
  }

  function closeNewListModal() {
    setIsNewListOpen(false);

    setNewList({
      name: "",
      category: "General",
      description: ""
    });

    markSaved();
  }

  async function handleCreateList(event) {
    event?.preventDefault();

    if (!newList.name.trim()) {
      setStatusMessage("List name is required.");
      return false;
    }

    if (!user) {
      setStatusMessage("Sign in from the Farmers Hub sidebar to save lists.");
      return false;
    }

    const list = {
      id: makeId("list"),
      name: newList.name.trim(),
      category: newList.category,
      description: newList.description.trim()
    };

    try {
      const listId = await createList(user.uid, list);

      setStatusMessage("List created.");

      setIsNewListOpen(false);
      setNewList({
        name: "",
        category: "General",
        description: ""
      });

      await loadLists();
      await openList(listId);
      markSaved();

      return true;
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not create list.");
      return false;
    }
  }

  async function handleDeleteList(listId) {
    if (!user) return;

    try {
      await deleteList(user.uid, listId);

      setStatusMessage("List deleted.");
      setSelectedList(null);

      await loadLists();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete list.");
    }
  }

  async function handleAddItem(event) {
    event?.preventDefault();

    if (!selectedList || !newItemText.trim() || !user) return false;

    const item = {
      id: makeId("item"),
      text: newItemText.trim(),
      checked: false
    };

    try {
      await addListItem(user.uid, selectedList.id, item);

      setNewItemText("");

      const detail = await getListDetail(user.uid, selectedList.id);

      setSelectedList(detail);

      await loadLists();
      markSaved();

      return true;
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not add item.");
      return false;
    }
  }

  async function handleToggleItem(item) {
    if (!selectedList || !user) return;

    try {
      await updateListItem(user.uid, selectedList.id, item.id, {
        checked: !item.checked
      });

      const detail = await getListDetail(user.uid, selectedList.id);

      setSelectedList(detail);

      await loadLists();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not update item.");
    }
  }

  async function handleDeleteItem(itemId) {
    if (!selectedList || !user) return;

    try {
      await deleteListItem(user.uid, selectedList.id, itemId);

      const detail = await getListDetail(user.uid, selectedList.id);

      setSelectedList(detail);

      await loadLists();
    } catch (error) {
      console.error(error);
      setStatusMessage("Could not delete item.");
    }
  }

  const filteredLists = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return lists.filter((list) => {
      if (!query) return true;

      return (
        list.name?.toLowerCase().includes(query) ||
        list.category?.toLowerCase().includes(query) ||
        list.description?.toLowerCase().includes(query)
      );
    });
  }, [lists, searchTerm]);

  const selectedProgress = useMemo(() => {
    if (!selectedList?.items?.length) {
      return {
        checked: 0,
        total: 0,
        percent: 0
      };
    }

    const checked = selectedList.items.filter((item) => item.checked).length;
    const total = selectedList.items.length;

    return {
      checked,
      total,
      percent: Math.round((checked / total) * 100)
    };
  }, [selectedList]);

  const listSummary = useMemo(() => {
    const totalLists = lists.length;
    const totalItems = lists.reduce((sum, list) => sum + (list.itemCount || 0), 0);
    const checkedItems = lists.reduce(
      (sum, list) => sum + (list.checkedCount || 0),
      0
    );
    const completionPercent =
      totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return {
      totalLists,
      totalItems,
      checkedItems,
      completionPercent
    };
  }, [lists]);

  if (!user) {
    return (
      <div className="listsModule">
        <section className="permitGrantHero">
          <div>
            <h2>Lists</h2>

            <p>
              Sign in to create and save reusable lists for your vendor workflows.
            </p>
          </div>

          <button className="primaryButton" onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  if (selectedList) {
    return (
      <div className="listsModule">
        {statusMessage ? (
          <div className="floatingStatus success">
            <span>ⓘ</span>
            <span>{statusMessage}</span>

            <button type="button" onClick={() => setStatusMessage("")}>
              ×
            </button>
          </div>
        ) : null}

        <section className="listDetailHeader">
          <button
            className="secondaryButton compactButton"
            type="button"
            onClick={() => setSelectedList(null)}
          >
            <ArrowLeft size={16} />
            Back to Lists
          </button>

          <button
            className="iconButton danger"
            type="button"
            onClick={() => handleDeleteList(selectedList.id)}
          >
            <Trash2 size={16} />
          </button>
        </section>

        <section className="listDetailHero">
          <div>
            <p className="eyebrow">{selectedList.category || "List"}</p>

            <h2>{selectedList.name}</h2>

            {selectedList.description ? (
              <p>{selectedList.description}</p>
            ) : null}
          </div>

          <div className="listProgressCard">
            <strong>
              {selectedProgress.checked}/{selectedProgress.total}
            </strong>

            <span>completed</span>

            <div className="listProgressTrack">
              <div
                className="listProgressFill"
                style={{ width: `${selectedProgress.percent}%` }}
              />
            </div>
          </div>
        </section>

        <section className="listAddItemPanel">
          <form onSubmit={handleAddItem}>
            <input
              value={newItemText}
              onChange={(event) => {
                markListsDirty();
                setNewItemText(event.target.value);
              }}
              placeholder="Add an item..."
            />

            <button
              className={`primaryButton compactPrimary ${
                hasUnsavedChanges ? "dirtySaveButton" : ""
              }`}
              type="submit"
            >
              <Plus size={15} />
              {hasUnsavedChanges ? "Save Item" : "Add Item"}
            </button>
          </form>
        </section>

        <section className="listItemsPanel">
          {selectedList.items?.length ? (
            selectedList.items.map((item) => (
              <div
                className={item.checked ? "listItem checked" : "listItem"}
                key={item.id}
              >
                <button
                  className="listCheckButton"
                  type="button"
                  onClick={() => handleToggleItem(item)}
                >
                  {item.checked ? <CheckCircle2 size={20} /> : null}
                </button>

                <span>{item.text}</span>

                <button
                  className="listDeleteButton"
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="permitEmptyState">
              No items yet. Add your first item above.
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="listsModule">
      {statusMessage ? (
        <div className="floatingStatus success">
          <span>ⓘ</span>
          <span>{statusMessage}</span>

          <button type="button" onClick={() => setStatusMessage("")}>
            ×
          </button>
        </div>
      ) : null}

      <section className="permitGrantHero">
        <div>
          <h2>Lists</h2>

          <p>
            Create reusable checklists for market prep, production, shopping,
            permits, delivery, and ideas.
          </p>
        </div>

        <button
          className="permitAddButton"
          type="button"
          onClick={() => setIsNewListOpen(true)}
        >
          <ListPlus size={18} />
          New List
        </button>
      </section>

      <section className="permitFilterBar listsFilterBar">
        <div className="permitSearch">
          <Search size={18} />

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search lists..."
          />
        </div>
      </section>

      <section className="hubStatGrid listsStatGrid">
        <StatCard
          icon={Folder}
          label="Lists"
          value={listSummary.totalLists}
          sub="Saved workflow lists"
          accent="lists"
        />

        <StatCard
          icon={ClipboardList}
          label="Total Items"
          value={listSummary.totalItems}
          sub="Checklist items across all lists"
          accent="market"
        />

        <StatCard
          icon={CheckSquare}
          label="Completed"
          value={listSummary.checkedItems}
          sub="Items marked complete"
          accent="pricing"
        />

        <StatCard
          icon={Percent}
          label="Completion"
          value={`${listSummary.completionPercent}%`}
          sub="Overall checklist progress"
          accent="sourdough"
        />
      </section>

      <section className="listsGrid">
        {loading ? (
          <div className="permitEmptyState">Loading lists...</div>
        ) : filteredLists.length ? (
          filteredLists.map((list) => {
            const percent =
              list.itemCount > 0
                ? Math.round((list.checkedCount / list.itemCount) * 100)
                : 0;

            return (
              <button
                className="listCard"
                type="button"
                key={list.id}
                onClick={() => openList(list.id)}
              >
                <div className="listCardTop">
                  <div className="listCardIcon">
                    <ClipboardList size={22} />
                  </div>

                  <span>{list.category || "General"}</span>
                </div>

                <h3>{list.name}</h3>

                {list.description ? <p>{list.description}</p> : null}

                <div className="listCardFooter">
                  <span>
                    {list.checkedCount || 0}/{list.itemCount || 0} complete
                  </span>

                  <strong>{percent}%</strong>
                </div>

                <div className="listProgressTrack">
                  <div
                    className="listProgressFill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </button>
            );
          })
        ) : (
          <div className="permitEmptyState">
            No lists found. Create your first list.
          </div>
        )}
      </section>

      {isNewListOpen ? (
        <div className="permitModalOverlay" role="dialog" aria-modal="true">
          <div className="permitModal listsModal">
            <div className="permitModalHeader">
              <h3>Create New List</h3>

              <button type="button" onClick={closeNewListModal}>
                <X size={20} />
              </button>
            </div>

            <form className="permitModalForm" onSubmit={handleCreateList}>
              <label className="permitFull">
                List Name *
                <input
                  value={newList.name}
                  onChange={(event) => {
                    markListsDirty();
                    setNewList((current) => ({
                      ...current,
                      name: event.target.value
                    }));
                  }}
                  placeholder="e.g., Saturday Market Pack List"
                />
              </label>

              <label className="permitFull">
                Category
                <select
                  value={newList.category}
                  onChange={(event) => {
                    markListsDirty();
                    setNewList((current) => ({
                      ...current,
                      category: event.target.value
                    }));
                  }}
                >
                  {listCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="permitFull">
                Description
                <textarea
                  value={newList.description}
                  onChange={(event) => {
                    markListsDirty();
                    setNewList((current) => ({
                      ...current,
                      description: event.target.value
                    }));
                  }}
                  placeholder="Optional notes about this list..."
                />
              </label>

              <div className="permitModalActions permitFull">
                <button
                  className="secondaryButton compactButton"
                  type="button"
                  onClick={closeNewListModal}
                >
                  Cancel
                </button>

                <button
                  className={`primaryButton compactPrimary ${
                    hasUnsavedChanges ? "dirtySaveButton" : ""
                  }`}
                  type="submit"
                >
                  <Plus size={15} />
                  {hasUnsavedChanges ? "Save List" : "Create List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import {
  Pencil,
  Check,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, MenuItem } from "../types";
import { saveMenu } from "../utils/localStorage";

interface MenuManagementTabProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

// A text input that focuses itself on mount
function AutoFocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return <input ref={ref} {...props} />;
}

export function MenuManagementTab({ categories, onCategoriesChange }: MenuManagementTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ catId: string; itemId: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [addingItemToCat, setAddingItemToCat] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const startEditItem = (catId: string, item: MenuItem) => {
    setEditingItem({ catId, itemId: item.id });
    setEditName(item.name);
    setEditPrice(String(item.price));
    setAddingItemToCat(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditName("");
    setEditPrice("");
  };

  const saveEditItem = (catId: string, itemId: string) => {
    const trimmedName = editName.trim();
    const parsedPrice = parseFloat(editPrice);

    if (!trimmedName) {
      toast.error("Item name cannot be empty.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const updated = categories.map((cat) => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId
            ? { ...item, name: trimmedName, price: Math.round(parsedPrice) }
            : item
        ),
      };
    });

    saveMenu(updated);
    onCategoriesChange(updated);
    setEditingItem(null);
    toast.success("Item updated");
  };

  const startAddItem = (catId: string) => {
    setAddingItemToCat(catId);
    setNewItemName("");
    setNewItemPrice("");
    setEditingItem(null);
    setExpandedCategories((prev) => new Set([...prev, catId]));
  };

  const cancelAddItem = () => {
    setAddingItemToCat(null);
    setNewItemName("");
    setNewItemPrice("");
  };

  const saveNewItem = (catId: string) => {
    const trimmedName = newItemName.trim();
    const parsedPrice = parseFloat(newItemPrice);

    if (!trimmedName) {
      toast.error("Item name cannot be empty.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    const newItem: MenuItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      price: Math.round(parsedPrice),
    };

    const updated = categories.map((c) =>
      c.id === catId ? { ...c, items: [...c.items, newItem] } : c
    );

    saveMenu(updated);
    onCategoriesChange(updated);
    setAddingItemToCat(null);
    toast.success(`${trimmedName} added to ${cat.name}`);
  };

  const addCategory = () => {
    const trimmed = newCategoryName.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Category name cannot be empty.");
      return;
    }
    if (categories.some((c) => c.name.toUpperCase() === trimmed)) {
      toast.error("A category with this name already exists.");
      return;
    }

    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      items: [],
    };

    const updated = [...categories, newCat];
    saveMenu(updated);
    onCategoriesChange(updated);
    setShowAddCategory(false);
    setNewCategoryName("");
    toast.success(`Category "${trimmed}" added`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Menu Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Edit items and manage categories</p>
      </div>

      {/* ── Add Category ── */}
      <div className="px-4 mb-4">
        {showAddCategory ? (
          <div className="rounded-xl bg-card border border-cafe-amber/40 shadow-card p-4 space-y-3 animate-pop-in">
            <h3 className="text-sm font-bold text-foreground">New Category</h3>
            <AutoFocusInput
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCategory();
                if (e.key === "Escape") { setShowAddCategory(false); setNewCategoryName(""); }
              }}
              placeholder="Category name (e.g., DESSERTS)"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}
                className="flex-1 h-10 rounded-lg border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCategory}
                className="flex-1 h-10 rounded-lg bg-cafe-amber text-white text-sm font-bold hover:bg-cafe-amber-dark transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddCategory(true)}
            className="w-full h-11 rounded-xl border-2 border-dashed border-cafe-amber/50 text-cafe-amber text-sm font-semibold hover:bg-cafe-amber-light transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        )}
      </div>

      {/* ── Category list ── */}
      <div className="px-4 pb-6 space-y-3">
        {categories.map((cat) => {
          const isExpanded = expandedCategories.has(cat.id);
          const isAddingHere = addingItemToCat === cat.id;

          return (
            <div key={cat.id} className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
              {/* Category header */}
              <div className="flex items-center px-4 py-3 bg-secondary border-b border-border gap-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-sm font-bold text-foreground tracking-wide">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">({cat.items.length})</span>
                  <span className="ml-auto text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startAddItem(cat.id)}
                  className="h-8 px-3 rounded-lg bg-cafe-amber-light text-cafe-espresso border border-cafe-amber/40 text-xs font-semibold hover:bg-cafe-amber hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              {/* Items list */}
              {isExpanded && (
                <div className="divide-y divide-border">
                  {cat.items.map((item) => {
                    const isEditing =
                      editingItem?.catId === cat.id && editingItem?.itemId === item.id;

                    if (isEditing) {
                      return (
                        <div key={item.id} className="px-4 py-3 bg-cafe-amber-light/30 animate-pop-in">
                          <div className="space-y-2">
                            <AutoFocusInput
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditItem(cat.id, item.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber"
                              placeholder="Item name"
                            />
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEditItem(cat.id, item.id);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  className="w-full h-9 pl-7 pr-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber"
                                  placeholder="Price"
                                  min="1"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Cancel edit"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditItem(cat.id, item.id)}
                                className="h-9 w-9 rounded-lg bg-cafe-amber text-white flex items-center justify-center hover:bg-cafe-amber-dark transition-colors"
                                aria-label="Save edit"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                        <span className="flex-1 text-sm text-foreground truncate">{item.name}</span>
                        <span className="text-sm font-bold text-cafe-espresso shrink-0 tabular-nums">
                          ₹{item.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditItem(cat.id, item)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-cafe-amber hover:bg-cafe-amber-light transition-colors shrink-0"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add item inline form */}
                  {isAddingHere && (
                    <div className="px-4 py-3 bg-cafe-amber-light/30 animate-pop-in">
                      <p className="text-xs font-semibold text-cafe-espresso mb-2">New Item</p>
                      <div className="space-y-2">
                        <AutoFocusInput
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") cancelAddItem(); }}
                          className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber"
                          placeholder="Item name"
                        />
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                            <input
                              type="number"
                              value={newItemPrice}
                              onChange={(e) => setNewItemPrice(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Escape") cancelAddItem(); }}
                              className="w-full h-9 pl-7 pr-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cafe-amber/50 focus:border-cafe-amber"
                              placeholder="Price"
                              min="1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={cancelAddItem}
                            className="h-9 w-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => saveNewItem(cat.id)}
                            className="h-9 w-9 rounded-lg bg-cafe-green text-white flex items-center justify-center hover:bg-cafe-green-dark transition-colors"
                            aria-label="Save new item"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {cat.items.length === 0 && !isAddingHere && (
                    <div className="px-4 py-4 text-center">
                      <p className="text-xs text-muted-foreground">No items yet. Tap &quot;Add Item&quot; to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

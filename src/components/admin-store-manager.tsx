"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useToast } from "@/components/toast"
import { formatPriceFromCents } from "@/lib/store"

type StoreCategory = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  _count?: {
    items: number
  }
}

type StoreItem = {
  id: string
  categoryId: string
  title: string
  description: string | null
  imageUrl: string | null
  priceCents: number
  oldPriceCents: number | null
  currency: string
  statusText: string | null
  buttonLabel: string
  purchaseUrl: string | null
  featureList: string[]
  isActive: boolean
  sortOrder: number
  category: {
    id: string
    name: string
  }
}

type CategoryFormState = {
  id: string | null
  name: string
  description: string
  imageUrl: string
  sortOrder: string
}

type ItemFormState = {
  id: string | null
  categoryId: string
  title: string
  description: string
  imageUrl: string
  price: string
  oldPrice: string
  currency: string
  statusText: string
  buttonLabel: string
  purchaseUrl: string
  featureList: string
  sortOrder: string
  isActive: boolean
}

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  id: null,
  name: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
}

const EMPTY_ITEM_FORM: ItemFormState = {
  id: null,
  categoryId: "",
  title: "",
  description: "",
  imageUrl: "",
  price: "",
  oldPrice: "",
  currency: "USD",
  statusText: "Laos olemas",
  buttonLabel: "Osta kohe",
  purchaseUrl: "",
  featureList: "",
  sortOrder: "0",
  isActive: true,
}

function centsToInput(priceCents: number): string {
  const amount = priceCents / 100
  return Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)
}

export function AdminStoreManager() {
  const toast = useToast()
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM)
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM)
  const [savingCategory, setSavingCategory] = useState(false)
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesRes, itemsRes] = await Promise.all([
          fetch("/api/store/categories"),
          fetch("/api/store/items"),
        ])

        if (!categoriesRes.ok || !itemsRes.ok) {
          throw new Error("Failed to load")
        }

        const [categoriesData, itemsData] = await Promise.all([
          categoriesRes.json(),
          itemsRes.json(),
        ])

        setCategories(categoriesData)
        setItems(itemsData)
        setItemForm((current) => ({
          ...current,
          categoryId: current.categoryId || categoriesData[0]?.id || "",
        }))
      } catch {
        toast.addToast("Poehalduri laadimine ebaõnnestus", "error")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.sortOrder === b.sortOrder ? a.name.localeCompare(b.name) : a.sortOrder - b.sortOrder
      ),
    [categories]
  )

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.sortOrder === b.sortOrder ? a.title.localeCompare(b.title) : a.sortOrder - b.sortOrder
      ),
    [items]
  )

  function resetCategoryForm() {
    setCategoryForm(EMPTY_CATEGORY_FORM)
  }

  function resetItemForm(nextCategoryId?: string) {
    setItemForm({
      ...EMPTY_ITEM_FORM,
      categoryId: nextCategoryId ?? sortedCategories[0]?.id ?? "",
    })
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingCategory(true)

    try {
      const endpoint = categoryForm.id
        ? `/api/store/categories/${categoryForm.id}`
        : "/api/store/categories"
      const method = categoryForm.id ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
          imageUrl: categoryForm.imageUrl,
          sortOrder: categoryForm.sortOrder,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.addToast(data.error || "Kategooria salvestamine ebaõnnestus", "error")
        return
      }

      setCategories((current) =>
        categoryForm.id
          ? current.map((category) => (category.id === data.id ? data : category))
          : [data, ...current]
      )
      setItemForm((current) => ({
        ...current,
        categoryId: current.categoryId || data.id,
      }))
      resetCategoryForm()
      toast.addToast(categoryForm.id ? "Kategooria uuendatud" : "Kategooria loodud", "success")
    } catch {
      toast.addToast("Kategooria salvestamine ebaõnnestus", "error")
    } finally {
      setSavingCategory(false)
    }
  }

  async function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingItem(true)

    try {
      const endpoint = itemForm.id ? `/api/store/items/${itemForm.id}` : "/api/store/items"
      const method = itemForm.id ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: itemForm.categoryId,
          title: itemForm.title,
          description: itemForm.description,
          imageUrl: itemForm.imageUrl,
          price: itemForm.price,
          oldPrice: itemForm.oldPrice,
          currency: itemForm.currency,
          statusText: itemForm.statusText,
          buttonLabel: itemForm.buttonLabel,
          purchaseUrl: itemForm.purchaseUrl,
          featureList: itemForm.featureList,
          sortOrder: itemForm.sortOrder,
          isActive: itemForm.isActive,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.addToast(data.error || "Toote salvestamine ebaõnnestus", "error")
        return
      }

      setItems((current) =>
        itemForm.id
          ? current.map((item) => (item.id === data.id ? data : item))
          : [data, ...current]
      )
      resetItemForm(itemForm.categoryId)
      toast.addToast(itemForm.id ? "Toode uuendatud" : "Toode loodud", "success")
    } catch {
      toast.addToast("Toote salvestamine ebaõnnestus", "error")
    } finally {
      setSavingItem(false)
    }
  }

  async function handleDeleteCategory(category: StoreCategory) {
    if (!confirm(`Kas kustutada kategooria "${category.name}"? Kõik selles kategoorias olevad tooted eemaldatakse samuti.`)) {
      return
    }

    try {
      const response = await fetch(`/api/store/categories/${category.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed")

      setCategories((current) => current.filter((entry) => entry.id !== category.id))
      setItems((current) => current.filter((item) => item.categoryId !== category.id))

      if (categoryForm.id === category.id) {
        resetCategoryForm()
      }

      if (itemForm.categoryId === category.id) {
        resetItemForm(sortedCategories.find((entry) => entry.id !== category.id)?.id)
      }

      toast.addToast("Kategooria kustutatud", "success")
    } catch {
      toast.addToast("Kategooria kustutamine ebaõnnestus", "error")
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Kas kustutada see toode poest?")) return

    try {
      const response = await fetch(`/api/store/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed")

      setItems((current) => current.filter((item) => item.id !== itemId))
      if (itemForm.id === itemId) {
        resetItemForm(itemForm.categoryId)
      }
      toast.addToast("Toode kustutatud", "success")
    } catch {
      toast.addToast("Toote kustutamine ebaõnnestus", "error")
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Poehalduri laadimine...</p>
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        See redaktor juhib poe uut välimust. Kategooriate kaanepildid, tootekirjeldused,
        hinnad, lingid, olekutekstid ja võrdlusomadused on kõik siit muudetavad.
      </p>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <form
          onSubmit={handleCategorySubmit}
          className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {categoryForm.id ? "Muuda kategooriat" : "Loo kategooria"}
              </h3>
              <p className="text-sm text-zinc-400">
                Need kategooriad kuvatakse poelehe ülaosas suurte kaanekaartidena.
              </p>
            </div>
            {categoryForm.id && (
              <button
                type="button"
                onClick={resetCategoryForm}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                Tühista
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Nimi</span>
              <input
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="nt VIP"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Järjestus</span>
              <input
                type="number"
                value={categoryForm.sortOrder}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm text-zinc-300">
            <span>Kirjeldus</span>
            <textarea
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              placeholder="Kuvatakse toodete pealkirja all, kui see kategooria on valitud."
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1 text-sm text-zinc-300">
            <span>Kaanepildi URL</span>
            <input
              value={categoryForm.imageUrl}
              onChange={(event) =>
                setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
              placeholder="https://example.com"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
            />
          </label>

          {categoryForm.imageUrl && (
            <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
              <img
                src={categoryForm.imageUrl}
                alt="Kategooria eelvaade"
                className="h-40 w-full object-cover"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={savingCategory}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {savingCategory
              ? "Salvestamine..."
              : categoryForm.id
                ? "Uuenda kategooriat"
                : "Loo kategooria"}
          </button>
        </form>

        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Kategooriad ({sortedCategories.length})
          </h3>
          <div className="space-y-3">
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-zinc-500">Kategooriaid pole veel lisatud.</p>
            ) : (
              sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70"
                >
                  <div className="aspect-[16/7] bg-zinc-950">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                        Kaanepilt puudub
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-zinc-100">{category.name}</p>
                      <p className="text-sm text-zinc-400">
                        {category._count?.items ?? 0}{" "}
                        {(category._count?.items ?? 0) === 1 ? "toode" : "toodet"}
                        {category.description ? ` • ${category.description}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryForm({
                            id: category.id,
                            name: category.name,
                            description: category.description ?? "",
                            imageUrl: category.imageUrl ?? "",
                            sortOrder: String(category.sortOrder),
                          })
                        }
                        className="text-amber-400 hover:text-amber-300"
                      >
                        Muuda
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Kustuta
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <form
          onSubmit={handleItemSubmit}
          className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {itemForm.id ? "Muuda toodet" : "Loo toode"}
              </h3>
              <p className="text-sm text-zinc-400">
                Tooted kuvatakse poekaartidel ja võrdlustabelis.
              </p>
            </div>
            {itemForm.id && (
              <button
                type="button"
                onClick={() => resetItemForm(itemForm.categoryId)}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                Tühista
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Kategooria</span>
              <select
                value={itemForm.categoryId}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
                disabled={sortedCategories.length === 0}
              >
                {sortedCategories.length === 0 ? (
                  <option value="">Loo esmalt kategooria</option>
                ) : (
                  sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Pealkiri</span>
              <input
                value={itemForm.title}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="nt VIP+"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Praegune hind</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemForm.price}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, price: event.target.value }))
                }
                placeholder="9.99"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Vana hind (valikuline)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemForm.oldPrice}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, oldPrice: event.target.value }))
                }
                placeholder="19.99"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Valuuta</span>
              <input
                value={itemForm.currency}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, currency: event.target.value }))
                }
                placeholder="USD"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Olekutekst</span>
              <input
                value={itemForm.statusText}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, statusText: event.target.value }))
                }
                placeholder="Laos olemas"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Nupu tekst</span>
              <input
                value={itemForm.buttonLabel}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, buttonLabel: event.target.value }))
                }
                placeholder="Osta kohe"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300 md:col-span-2">
              <span>Ostulink (URL, valikuline)</span>
              <input
                value={itemForm.purchaseUrl}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, purchaseUrl: event.target.value }))
                }
                placeholder="https://your-store-link.example"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Pildi URL</span>
              <input
                value={itemForm.imageUrl}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
                placeholder="https://example.com"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>

            <label className="space-y-1 text-sm text-zinc-300">
              <span>Järjestus</span>
              <input
                type="number"
                value={itemForm.sortOrder}
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm text-zinc-300">
            <span>Kirjeldus</span>
            <textarea
              value={itemForm.description}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              placeholder="Toote kirjeldus"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1 text-sm text-zinc-300">
            <span>Võrdlusomadused (üks rea kohta)</span>
            <textarea
              value={itemForm.featureList}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, featureList: event.target.value }))
              }
              rows={4}
              placeholder="Prioriteetne järjekord&#10;Eksklusiivne roll Discordis"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition focus:border-amber-500"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={itemForm.isActive}
              onChange={(event) =>
                setItemForm((current) => ({ ...current, isActive: event.target.checked }))
              }
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-500"
            />
            <span>Poes nähtav</span>
          </label>

          <button
            type="submit"
            disabled={savingItem}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {savingItem
              ? "Salvestamine..."
              : itemForm.id
                ? "Uuenda toodet"
                : "Loo toode"}
          </button>
        </form>

        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            Tooted ({sortedItems.length})
          </h3>
          <div className="space-y-3">
            {sortedItems.length === 0 ? (
              <p className="text-sm text-zinc-500">Tooteid pole veel lisatud.</p>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70"
                >
                  <div className="aspect-[16/8] bg-zinc-950">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                        Pilt puudub
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-100">{item.title}</p>
                        <p className="text-sm text-zinc-400">
                          {item.category.name} • {formatPriceFromCents(item.priceCents, item.currency)}
                        </p>
                        <p className="text-xs text-emerald-300">
                          {item.statusText || "Laos olemas"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {item.isActive ? "Poes nähtav" : "Poes peidetud"}
                        </p>
                      </div>

                      <div className="flex gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setItemForm({
                              id: item.id,
                              categoryId: item.categoryId,
                              title: item.title,
                              description: item.description ?? "",
                              imageUrl: item.imageUrl ?? "",
                              price: centsToInput(item.priceCents),
                              oldPrice: item.oldPriceCents ? centsToInput(item.oldPriceCents) : "",
                              currency: item.currency,
                              statusText: item.statusText ?? "Laos olemas",
                              buttonLabel: item.buttonLabel,
                              purchaseUrl: item.purchaseUrl ?? "",
                              featureList: item.featureList.join("\n"),
                              sortOrder: String(item.sortOrder),
                              isActive: item.isActive,
                            })
                          }
                          className="text-amber-400 hover:text-amber-300"
                        >
                          Muuda
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Kustuta
                        </button>
                      </div>
                    </div>

                    {item.description && (
                      <p className="line-clamp-2 text-sm text-zinc-500">{item.description}</p>
                    )}

                    {item.featureList.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        Seadistatud {item.featureList.length}{" "}
                        {item.featureList.length === 1 ? "võrdlusomadus" : "võrdlusomadust"}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

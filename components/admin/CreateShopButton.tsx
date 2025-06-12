"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CreateShopButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    bot_token: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const shop = await response.json()
        setOpen(false)
        router.push(`/admin/shop/${shop.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error("Ошибка создания магазина:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Создать магазин</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Создать новый магазин</DialogTitle>
            <DialogDescription>Заполните основную информацию для создания магазина</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название магазина</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Мой супер магазин"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание вашего магазина"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bot_token">Telegram Bot Token</Label>
              <Input
                id="bot_token"
                value={formData.bot_token}
                onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                required
              />
              <p className="text-xs text-gray-500">Получите токен у @BotFather в Telegram</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Создание..." : "Создать магазин"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

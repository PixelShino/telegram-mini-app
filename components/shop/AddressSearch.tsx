"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface AddressData {
  country: string
  region: string
  city: string
  street: string
  house: string
  apartment: string
  entrance: string
  floor: string
  intercom: string
  isPrivateHouse: boolean
  entranceComment: string
}

interface AddressSearchProps {
  onAddressSelect: (address: string, addressData: AddressData) => void
  value: string
  addressData?: AddressData
}

export default function AddressSearch({ onAddressSelect, value, addressData }: AddressSearchProps) {
  const [manualAddress, setManualAddress] = useState<AddressData>(
    addressData || {
      country: "Россия",
      region: "",
      city: "",
      street: "",
      house: "",
      apartment: "",
      entrance: "",
      floor: "",
      intercom: "",
      isPrivateHouse: false,
      entranceComment: "",
    },
  )

  const handleManualAddressChange = (field: keyof AddressData, value: string | boolean) => {
    const updatedAddress = { ...manualAddress, [field]: value }
    setManualAddress(updatedAddress)

    // Формируем строку адреса без региона
    const addressParts = [
      updatedAddress.country,
      updatedAddress.city,
      updatedAddress.street,
      updatedAddress.house && `дом ${updatedAddress.house}`,
      updatedAddress.apartment && !updatedAddress.isPrivateHouse && `кв. ${updatedAddress.apartment}`,
    ].filter(Boolean)

    const fullAddress = addressParts.join(", ")
    onAddressSelect(fullAddress, updatedAddress)
  }

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Адрес доставки</Label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Укажите адрес доставки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="country">Страна</Label>
            <Input
              id="country"
              value={manualAddress.country}
              onChange={(e) => handleManualAddressChange("country", e.target.value)}
              placeholder="Россия"
            />
          </div>

          <div>
            <Label htmlFor="city">Город *</Label>
            <Input
              id="city"
              value={manualAddress.city}
              onChange={(e) => handleManualAddressChange("city", e.target.value)}
              placeholder="Москва"
              required
            />
          </div>

          <div>
            <Label htmlFor="street">Улица *</Label>
            <Input
              id="street"
              value={manualAddress.street}
              onChange={(e) => handleManualAddressChange("street", e.target.value)}
              placeholder="улица Арбат"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="house">Дом *</Label>
              <Input
                id="house"
                value={manualAddress.house}
                onChange={(e) => handleManualAddressChange("house", e.target.value)}
                placeholder="15"
                required
              />
            </div>
            {!manualAddress.isPrivateHouse && (
              <div>
                <Label htmlFor="apartment">Квартира</Label>
                <Input
                  id="apartment"
                  value={manualAddress.apartment}
                  onChange={(e) => handleManualAddressChange("apartment", e.target.value)}
                  placeholder="123"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrivateHouse"
              checked={manualAddress.isPrivateHouse}
              onCheckedChange={(checked) => handleManualAddressChange("isPrivateHouse", checked as boolean)}
            />
            <Label
              htmlFor="isPrivateHouse"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Частный дом
            </Label>
          </div>

          {!manualAddress.isPrivateHouse && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="entrance">Подъезд</Label>
                <Input
                  id="entrance"
                  value={manualAddress.entrance}
                  onChange={(e) => handleManualAddressChange("entrance", e.target.value)}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="floor">Этаж</Label>
                <Input
                  id="floor"
                  value={manualAddress.floor}
                  onChange={(e) => handleManualAddressChange("floor", e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="intercom">Домофон</Label>
                <Input
                  id="intercom"
                  value={manualAddress.intercom}
                  onChange={(e) => handleManualAddressChange("intercom", e.target.value)}
                  placeholder="123К"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="entranceComment">Комментарий ко входу</Label>
            <Textarea
              id="entranceComment"
              value={manualAddress.entranceComment}
              onChange={(e) => handleManualAddressChange("entranceComment", e.target.value)}
              placeholder="Как найти вход, особенности доставки..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

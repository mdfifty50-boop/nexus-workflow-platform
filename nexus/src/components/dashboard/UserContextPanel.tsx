/**
 * UserContextPanel
 *
 * Displays auto-saved user context extracted from AI chat interactions.
 * Shows addresses, preferences, contacts, and behavioral patterns.
 * Provides edit and delete capabilities for all context items.
 */

import { useState, useEffect } from 'react'
import { useUserContext } from '@/lib/context'
import { loadUserContext, updateContextField } from '@/lib/context'
import type { UserAddress, FrequentContact, FoodPreference } from '@/types/user-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, MapPin, User, Utensils, Globe, Clock, RefreshCw, AlertCircle } from 'lucide-react'

interface UserContextPanelProps {
  userId?: string
  className?: string
}

export function UserContextPanel({ userId, className = '' }: UserContextPanelProps) {
  const { context, isLoading, refreshContext } = useUserContext({ autoSave: false })
  const [editingItem, setEditingItem] = useState<{ type: string; id: string } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load context on mount if userId provided
  useEffect(() => {
    if (userId && !context) {
      loadUserContext(userId)
    }
  }, [userId, context])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshContext()
    setIsRefreshing(false)
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!context) return

    const updatedAddresses = context.addresses.filter(a => a.id !== addressId)
    await updateContextField('addresses', updatedAddresses, context.userId)
    await refreshContext()
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!context) return

    const updatedContacts = context.frequentContacts.filter(c => c.id !== contactId)
    await updateContextField('frequentContacts', updatedContacts, context.userId)
    await refreshContext()
  }

  const handleDeletePreference = async (prefId: string) => {
    if (!context) return

    const updatedPrefs = context.foodPreferences.filter(p => p.id !== prefId)
    await updateContextField('foodPreferences', updatedPrefs, context.userId)
    await refreshContext()
  }

  const handleEditAddress = (addressId: string) => {
    setEditingItem({ type: 'address', id: addressId })
  }

  const handleEditContact = (contactId: string) => {
    setEditingItem({ type: 'contact', id: contactId })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Context
          </CardTitle>
          <CardDescription>Loading your saved information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!context) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Context
          </CardTitle>
          <CardDescription>No context saved yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <p>Start chatting with the AI to automatically save your preferences and information.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasData =
    context.addresses.length > 0 ||
    context.frequentContacts.length > 0 ||
    context.foodPreferences.length > 0

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Context
            </CardTitle>
            <CardDescription>
              Auto-saved from AI conversations
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasData && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <p>No context data available. Mention your address, preferences, or contacts in chat to save them.</p>
          </div>
        )}

        {/* Addresses Section */}
        {context.addresses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Addresses ({context.addresses.length})
            </h3>
            <div className="space-y-2">
              {context.addresses.map((address) => (
                <AddressItem
                  key={address.id}
                  address={address}
                  onEdit={() => handleEditAddress(address.id)}
                  onDelete={() => handleDeleteAddress(address.id)}
                  isEditing={editingItem?.type === 'address' && editingItem.id === address.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Food Preferences Section */}
        {context.foodPreferences.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Food Preferences ({context.foodPreferences.length})
            </h3>
            <div className="space-y-2">
              {context.foodPreferences.map((pref) => (
                <PreferenceItem
                  key={pref.id}
                  preference={pref}
                  onDelete={() => handleDeletePreference(pref.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Contacts Section */}
        {context.frequentContacts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Frequent Contacts ({context.frequentContacts.length})
            </h3>
            <div className="space-y-2">
              {context.frequentContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  onEdit={() => handleEditContact(contact.id)}
                  onDelete={() => handleDeleteContact(contact.id)}
                  isEditing={editingItem?.type === 'contact' && editingItem.id === contact.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Communication Preferences Section */}
        {context.communicationPreferences && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Communication Preferences
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground">Language</span>
                <Badge variant="secondary">{context.communicationPreferences.preferredLanguage}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Timezone
                </span>
                <Badge variant="secondary">{context.communicationPreferences.timeZone}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Behavioral Preferences Section */}
        {context.behavioralPreferences && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Behavioral Preferences</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground">Automation Level</span>
                <Badge variant="secondary">{context.behavioralPreferences.automationLevel}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground">Privacy Level</span>
                <Badge variant="secondary">{context.behavioralPreferences.privacyLevel}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Context Metadata */}
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>Last updated: {new Date(context.updatedAt).toLocaleString()}</p>
          <p>Source: {context.source}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Address Item Component
function AddressItem({
  address,
  onEdit,
  onDelete
}: {
  address: UserAddress
  onEdit: () => void
  onDelete: () => void
  isEditing?: boolean
}) {
  return (
    <div className="p-3 bg-muted/50 rounded-md border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={address.isPrimary ? "default" : "outline"} className="text-xs">
              {address.label}
            </Badge>
            {address.isPrimary && (
              <Badge variant="secondary" className="text-xs">Primary</Badge>
            )}
          </div>
          <p className="text-sm font-medium">{address.fullAddress}</p>
          <div className="flex gap-2 text-xs text-muted-foreground mt-1">
            <span>{address.city}</span>
            {address.state && <span>• {address.state}</span>}
            {address.postalCode && <span>• {address.postalCode}</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Contact Item Component
function ContactItem({
  contact,
  onEdit,
  onDelete
}: {
  contact: FrequentContact
  onEdit: () => void
  onDelete: () => void
  isEditing?: boolean
}) {
  return (
    <div className="p-3 bg-muted/50 rounded-md border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">{contact.name}</p>
            {contact.relationship && (
              <Badge variant="outline" className="text-xs">
                {contact.relationship}
              </Badge>
            )}
            <Badge
              variant={contact.priority === 'high' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {contact.priority}
            </Badge>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {contact.email && <p>Email: {contact.email}</p>}
            {contact.phone && <p>Phone: {contact.phone}</p>}
            {contact.notes && <p className="italic">{contact.notes}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Preference Item Component
function PreferenceItem({
  preference,
  onDelete
}: {
  preference: FoodPreference
  onDelete: () => void
}) {
  return (
    <div className="p-3 bg-muted/50 rounded-md border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium capitalize">
              {preference.category.replace(/_/g, ' ')}
            </p>
            {preference.isRestriction && (
              <Badge variant="destructive" className="text-xs">
                Restriction
              </Badge>
            )}
            {preference.severity && (
              <Badge variant="outline" className="text-xs">
                {preference.severity}
              </Badge>
            )}
          </div>
          {preference.description && (
            <p className="text-xs text-muted-foreground">{preference.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

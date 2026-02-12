import { useState } from 'react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Teilnehmer } from '@/types/app';

interface TeilnehmerTabProps {
  teilnehmer: Teilnehmer[];
  onRefresh: () => void;
}

export function TeilnehmerTab({ teilnehmer, onRefresh }: TeilnehmerTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', telefon: '', geburtsdatum: '' });

  const resetForm = () => {
    setForm({ name: '', email: '', telefon: '', geburtsdatum: '' });
    setEditingId(null);
  };

  const handleOpenDialog = (t?: Teilnehmer) => {
    if (t) {
      setEditingId(t.record_id);
      setForm({
        name: t.fields.name || '',
        email: t.fields.email || '',
        telefon: t.fields.telefon || '',
        geburtsdatum: t.fields.geburtsdatum || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      const data = {
        name: form.name,
        email: form.email,
        telefon: form.telefon || undefined,
        geburtsdatum: form.geburtsdatum || undefined,
      };
      if (editingId) {
        await LivingAppsService.updateTeilnehmerEntry(editingId, data);
      } else {
        await LivingAppsService.createTeilnehmerEntry(data);
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setLoading(true);
    try {
      await LivingAppsService.deleteTeilnehmerEntry(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '–';
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Teilnehmer</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Kursteilnehmer</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Teilnehmer hinzufügen
        </Button>
      </div>

      {teilnehmer.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="Keine Teilnehmer"
          description="Fügen Sie Ihren ersten Teilnehmer hinzu, um loszulegen."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4" />
              Teilnehmer hinzufügen
            </Button>
          }
        />
      ) : (
        <div className="data-table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Geburtsdatum</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teilnehmer.map((t) => (
                <TableRow key={t.record_id}>
                  <TableCell className="font-medium">{t.fields.name}</TableCell>
                  <TableCell>{t.fields.email}</TableCell>
                  <TableCell>{t.fields.telefon || '–'}</TableCell>
                  <TableCell>{formatDate(t.fields.geburtsdatum)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteDialog({ open: true, id: t.record_id })}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          </DialogHeader>
          <div className="form-section">
            <div className="space-y-2">
              <Label htmlFor="teilnehmer-name">Name *</Label>
              <Input
                id="teilnehmer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Anna Beispiel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teilnehmer-email">E-Mail *</Label>
              <Input
                id="teilnehmer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="anna@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teilnehmer-telefon">Telefon</Label>
              <Input
                id="teilnehmer-telefon"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teilnehmer-geburtsdatum">Geburtsdatum</Label>
              <Input
                id="teilnehmer-geburtsdatum"
                type="date"
                value={form.geburtsdatum}
                onChange={(e) => setForm({ ...form, geburtsdatum: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={loading || !form.name || !form.email}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: open ? deleteDialog.id : null })}
        title="Teilnehmer löschen"
        description="Möchten Sie diesen Teilnehmer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}

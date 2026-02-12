import { useState, useEffect } from 'react';
import { Plus, GraduationCap, Pencil, Trash2 } from 'lucide-react';
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
import type { Dozenten } from '@/types/app';

interface DozentenTabProps {
  dozenten: Dozenten[];
  onRefresh: () => void;
}

export function DozentenTab({ dozenten, onRefresh }: DozentenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', telefon: '', fachgebiet: '' });

  const resetForm = () => {
    setForm({ name: '', email: '', telefon: '', fachgebiet: '' });
    setEditingId(null);
  };

  const handleOpenDialog = (dozent?: Dozenten) => {
    if (dozent) {
      setEditingId(dozent.record_id);
      setForm({
        name: dozent.fields.name || '',
        email: dozent.fields.email || '',
        telefon: dozent.fields.telefon || '',
        fachgebiet: dozent.fields.fachgebiet || '',
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
      if (editingId) {
        await LivingAppsService.updateDozentenEntry(editingId, form);
      } else {
        await LivingAppsService.createDozentenEntry(form);
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
      await LivingAppsService.deleteDozentenEntry(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dozenten</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Kursleiter</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Dozent hinzufügen
        </Button>
      </div>

      {dozenten.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-8" />}
          title="Keine Dozenten"
          description="Fügen Sie Ihren ersten Dozenten hinzu, um loszulegen."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4" />
              Dozent hinzufügen
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
                <TableHead>Fachgebiet</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dozenten.map((d) => (
                <TableRow key={d.record_id}>
                  <TableCell className="font-medium">{d.fields.name}</TableCell>
                  <TableCell>{d.fields.email}</TableCell>
                  <TableCell>{d.fields.telefon || '–'}</TableCell>
                  <TableCell>
                    {d.fields.fachgebiet ? (
                      <span className="badge-muted">{d.fields.fachgebiet}</span>
                    ) : '–'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog(d)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteDialog({ open: true, id: d.record_id })}
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
            <DialogTitle>{editingId ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
          </DialogHeader>
          <div className="form-section">
            <div className="space-y-2">
              <Label htmlFor="dozent-name">Name *</Label>
              <Input
                id="dozent-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dozent-email">E-Mail *</Label>
              <Input
                id="dozent-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="max@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dozent-telefon">Telefon</Label>
              <Input
                id="dozent-telefon"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dozent-fachgebiet">Fachgebiet</Label>
              <Input
                id="dozent-fachgebiet"
                value={form.fachgebiet}
                onChange={(e) => setForm({ ...form, fachgebiet: e.target.value })}
                placeholder="z.B. Informatik, Marketing"
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
        title="Dozent löschen"
        description="Möchten Sie diesen Dozenten wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}

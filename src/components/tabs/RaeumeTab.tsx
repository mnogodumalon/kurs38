import { useState } from 'react';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
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
import type { Raeume } from '@/types/app';

interface RaeumeTabProps {
  raeume: Raeume[];
  onRefresh: () => void;
}

export function RaeumeTab({ raeume, onRefresh }: RaeumeTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ raumname: '', gebaeude: '', kapazitaet: '' });

  const resetForm = () => {
    setForm({ raumname: '', gebaeude: '', kapazitaet: '' });
    setEditingId(null);
  };

  const handleOpenDialog = (raum?: Raeume) => {
    if (raum) {
      setEditingId(raum.record_id);
      setForm({
        raumname: raum.fields.raumname || '',
        gebaeude: raum.fields.gebaeude || '',
        kapazitaet: raum.fields.kapazitaet?.toString() || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.raumname || !form.gebaeude || !form.kapazitaet) return;
    setLoading(true);
    try {
      const data = {
        raumname: form.raumname,
        gebaeude: form.gebaeude,
        kapazitaet: parseInt(form.kapazitaet, 10),
      };
      if (editingId) {
        await LivingAppsService.updateRaeumeEntry(editingId, data);
      } else {
        await LivingAppsService.createRaeumeEntry(data);
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
      await LivingAppsService.deleteRaeumeEntry(deleteDialog.id);
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
          <h2 className="text-xl font-semibold text-foreground">Räume</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Schulungsräume</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Raum hinzufügen
        </Button>
      </div>

      {raeume.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="Keine Räume"
          description="Fügen Sie Ihren ersten Raum hinzu, um loszulegen."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4" />
              Raum hinzufügen
            </Button>
          }
        />
      ) : (
        <div className="data-table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raumname</TableHead>
                <TableHead>Gebäude</TableHead>
                <TableHead>Kapazität</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raeume.map((r) => (
                <TableRow key={r.record_id}>
                  <TableCell className="font-medium">{r.fields.raumname}</TableCell>
                  <TableCell>{r.fields.gebaeude}</TableCell>
                  <TableCell>
                    <span className="badge-muted">{r.fields.kapazitaet} Plätze</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog(r)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteDialog({ open: true, id: r.record_id })}
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
            <DialogTitle>{editingId ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          </DialogHeader>
          <div className="form-section">
            <div className="space-y-2">
              <Label htmlFor="raum-name">Raumname *</Label>
              <Input
                id="raum-name"
                value={form.raumname}
                onChange={(e) => setForm({ ...form, raumname: e.target.value })}
                placeholder="z.B. Seminarraum A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raum-gebaeude">Gebäude *</Label>
              <Input
                id="raum-gebaeude"
                value={form.gebaeude}
                onChange={(e) => setForm({ ...form, gebaeude: e.target.value })}
                placeholder="z.B. Hauptgebäude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raum-kapazitaet">Kapazität *</Label>
              <Input
                id="raum-kapazitaet"
                type="number"
                min="1"
                value={form.kapazitaet}
                onChange={(e) => setForm({ ...form, kapazitaet: e.target.value })}
                placeholder="z.B. 20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={loading || !form.raumname || !form.gebaeude || !form.kapazitaet}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: open ? deleteDialog.id : null })}
        title="Raum löschen"
        description="Möchten Sie diesen Raum wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}

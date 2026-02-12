import { useState } from 'react';
import { Plus, ClipboardList, Pencil, Trash2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Anmeldungen, Teilnehmer, Kurse } from '@/types/app';

interface AnmeldungenTabProps {
  anmeldungen: Anmeldungen[];
  teilnehmer: Teilnehmer[];
  kurse: Kurse[];
  onRefresh: () => void;
}

export function AnmeldungenTab({ anmeldungen, teilnehmer, kurse, onRefresh }: AnmeldungenTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    teilnehmer: '',
    kurs: '',
    anmeldedatum: '',
    bezahlt: false,
  });

  const resetForm = () => {
    setForm({ teilnehmer: '', kurs: '', anmeldedatum: '', bezahlt: false });
    setEditingId(null);
  };

  const handleOpenDialog = (a?: Anmeldungen) => {
    if (a) {
      setEditingId(a.record_id);
      setForm({
        teilnehmer: extractRecordId(a.fields.teilnehmer) || '',
        kurs: extractRecordId(a.fields.kurs) || '',
        anmeldedatum: a.fields.anmeldedatum || '',
        bezahlt: a.fields.bezahlt || false,
      });
    } else {
      // Set today as default registration date
      const today = new Date().toISOString().split('T')[0];
      setForm({ teilnehmer: '', kurs: '', anmeldedatum: today, bezahlt: false });
      setEditingId(null);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.teilnehmer || !form.kurs || !form.anmeldedatum) return;
    setLoading(true);
    try {
      const data = {
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmer),
        kurs: createRecordUrl(APP_IDS.KURSE, form.kurs),
        anmeldedatum: form.anmeldedatum,
        bezahlt: form.bezahlt,
      };
      if (editingId) {
        await LivingAppsService.updateAnmeldungenEntry(editingId, data);
      } else {
        await LivingAppsService.createAnmeldungenEntry(data);
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
      await LivingAppsService.deleteAnmeldungenEntry(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBezahlt = async (anmeldung: Anmeldungen) => {
    try {
      await LivingAppsService.updateAnmeldungenEntry(anmeldung.record_id, {
        bezahlt: !anmeldung.fields.bezahlt,
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to update payment status:', error);
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

  const getTeilnehmerName = (teilnehmerUrl?: string) => {
    const id = extractRecordId(teilnehmerUrl);
    if (!id) return '–';
    const t = teilnehmer.find(tn => tn.record_id === id);
    return t?.fields.name || '–';
  };

  const getKursName = (kursUrl?: string) => {
    const id = extractRecordId(kursUrl);
    if (!id) return '–';
    const k = kurse.find(ku => ku.record_id === id);
    return k?.fields.titel || '–';
  };

  const isFormValid = form.teilnehmer && form.kurs && form.anmeldedatum;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Anmeldungen</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie Kursanmeldungen</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Anmeldung hinzufügen
        </Button>
      </div>

      {anmeldungen.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-8" />}
          title="Keine Anmeldungen"
          description="Erstellen Sie die erste Kursanmeldung."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4" />
              Anmeldung hinzufügen
            </Button>
          }
        />
      ) : (
        <div className="data-table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teilnehmer</TableHead>
                <TableHead>Kurs</TableHead>
                <TableHead>Anmeldedatum</TableHead>
                <TableHead>Bezahlt</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anmeldungen.map((a) => (
                <TableRow key={a.record_id}>
                  <TableCell className="font-medium">{getTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                  <TableCell>{getKursName(a.fields.kurs)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(a.fields.anmeldedatum)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleBezahlt(a)}
                      className="cursor-pointer"
                    >
                      {a.fields.bezahlt ? (
                        <span className="badge-success">
                          <Check className="size-3" />
                          Bezahlt
                        </span>
                      ) : (
                        <span className="badge-warning">
                          <X className="size-3" />
                          Offen
                        </span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog(a)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteDialog({ open: true, id: a.record_id })}
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
            <DialogTitle>{editingId ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          </DialogHeader>
          <div className="form-section">
            <div className="space-y-2">
              <Label htmlFor="anmeldung-teilnehmer">Teilnehmer *</Label>
              <Select value={form.teilnehmer} onValueChange={(v) => setForm({ ...form, teilnehmer: v })}>
                <SelectTrigger id="anmeldung-teilnehmer">
                  <SelectValue placeholder="Teilnehmer auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {teilnehmer.map((t) => (
                    <SelectItem key={t.record_id} value={t.record_id}>
                      {t.fields.name} ({t.fields.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anmeldung-kurs">Kurs *</Label>
              <Select value={form.kurs} onValueChange={(v) => setForm({ ...form, kurs: v })}>
                <SelectTrigger id="anmeldung-kurs">
                  <SelectValue placeholder="Kurs auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {kurse.map((k) => (
                    <SelectItem key={k.record_id} value={k.record_id}>
                      {k.fields.titel} ({formatDate(k.fields.startdatum)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anmeldung-datum">Anmeldedatum *</Label>
              <Input
                id="anmeldung-datum"
                type="date"
                value={form.anmeldedatum}
                onChange={(e) => setForm({ ...form, anmeldedatum: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="anmeldung-bezahlt"
                checked={form.bezahlt}
                onCheckedChange={(checked) => setForm({ ...form, bezahlt: checked === true })}
              />
              <Label htmlFor="anmeldung-bezahlt" className="cursor-pointer">
                Bezahlt
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={loading || !isFormValid}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: open ? deleteDialog.id : null })}
        title="Anmeldung löschen"
        description="Möchten Sie diese Anmeldung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}

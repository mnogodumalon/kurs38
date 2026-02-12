import { useState } from 'react';
import { Plus, BookOpen, Pencil, Trash2, Euro } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { Kurse, Dozenten, Raeume } from '@/types/app';

interface KurseTabProps {
  kurse: Kurse[];
  dozenten: Dozenten[];
  raeume: Raeume[];
  onRefresh: () => void;
}

export function KurseTab({ kurse, dozenten, raeume, onRefresh }: KurseTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titel: '',
    beschreibung: '',
    startdatum: '',
    enddatum: '',
    max_teilnehmer: '',
    preis: '',
    dozent: '',
    raum: '',
  });

  const resetForm = () => {
    setForm({
      titel: '',
      beschreibung: '',
      startdatum: '',
      enddatum: '',
      max_teilnehmer: '',
      preis: '',
      dozent: '',
      raum: '',
    });
    setEditingId(null);
  };

  const handleOpenDialog = (k?: Kurse) => {
    if (k) {
      setEditingId(k.record_id);
      setForm({
        titel: k.fields.titel || '',
        beschreibung: k.fields.beschreibung || '',
        startdatum: k.fields.startdatum || '',
        enddatum: k.fields.enddatum || '',
        max_teilnehmer: k.fields.max_teilnehmer?.toString() || '',
        preis: k.fields.preis?.toString() || '',
        dozent: extractRecordId(k.fields.dozent) || '',
        raum: extractRecordId(k.fields.raum) || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.titel || !form.startdatum || !form.enddatum || !form.max_teilnehmer || !form.preis || !form.dozent || !form.raum) return;
    setLoading(true);
    try {
      const data = {
        titel: form.titel,
        beschreibung: form.beschreibung || undefined,
        startdatum: form.startdatum,
        enddatum: form.enddatum,
        max_teilnehmer: parseInt(form.max_teilnehmer, 10),
        preis: parseFloat(form.preis),
        dozent: createRecordUrl(APP_IDS.DOZENTEN, form.dozent),
        raum: createRecordUrl(APP_IDS.RAEUME, form.raum),
      };
      if (editingId) {
        await LivingAppsService.updateKurseEntry(editingId, data);
      } else {
        await LivingAppsService.createKurseEntry(data);
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
      await LivingAppsService.deleteKurseEntry(deleteDialog.id);
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

  const getDozentName = (dozentUrl?: string) => {
    const id = extractRecordId(dozentUrl);
    if (!id) return '–';
    const dozent = dozenten.find(d => d.record_id === id);
    return dozent?.fields.name || '–';
  };

  const getRaumName = (raumUrl?: string) => {
    const id = extractRecordId(raumUrl);
    if (!id) return '–';
    const raum = raeume.find(r => r.record_id === id);
    return raum ? `${raum.fields.raumname} (${raum.fields.gebaeude})` : '–';
  };

  const isFormValid = form.titel && form.startdatum && form.enddatum && form.max_teilnehmer && form.preis && form.dozent && form.raum;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Kurse</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Kursangebote</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Kurs hinzufügen
        </Button>
      </div>

      {kurse.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-8" />}
          title="Keine Kurse"
          description="Fügen Sie Ihren ersten Kurs hinzu, um loszulegen."
          action={
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4" />
              Kurs hinzufügen
            </Button>
          }
        />
      ) : (
        <div className="data-table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Zeitraum</TableHead>
                <TableHead>Dozent</TableHead>
                <TableHead>Raum</TableHead>
                <TableHead>Max. TN</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kurse.map((k) => (
                <TableRow key={k.record_id}>
                  <TableCell className="font-medium">{k.fields.titel}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(k.fields.startdatum)} – {formatDate(k.fields.enddatum)}
                  </TableCell>
                  <TableCell>{getDozentName(k.fields.dozent)}</TableCell>
                  <TableCell>{getRaumName(k.fields.raum)}</TableCell>
                  <TableCell>
                    <span className="badge-muted">{k.fields.max_teilnehmer}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">{k.fields.preis?.toFixed(2)} €</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDialog(k)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteDialog({ open: true, id: k.record_id })}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          </DialogHeader>
          <div className="form-section max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="kurs-titel">Titel *</Label>
              <Input
                id="kurs-titel"
                value={form.titel}
                onChange={(e) => setForm({ ...form, titel: e.target.value })}
                placeholder="z.B. Einführung in Python"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-beschreibung">Beschreibung</Label>
              <Textarea
                id="kurs-beschreibung"
                value={form.beschreibung}
                onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
                placeholder="Kursbeschreibung..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kurs-startdatum">Startdatum *</Label>
                <Input
                  id="kurs-startdatum"
                  type="date"
                  value={form.startdatum}
                  onChange={(e) => setForm({ ...form, startdatum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kurs-enddatum">Enddatum *</Label>
                <Input
                  id="kurs-enddatum"
                  type="date"
                  value={form.enddatum}
                  onChange={(e) => setForm({ ...form, enddatum: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kurs-max-teilnehmer">Max. Teilnehmer *</Label>
                <Input
                  id="kurs-max-teilnehmer"
                  type="number"
                  min="1"
                  value={form.max_teilnehmer}
                  onChange={(e) => setForm({ ...form, max_teilnehmer: e.target.value })}
                  placeholder="z.B. 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kurs-preis">Preis (€) *</Label>
                <Input
                  id="kurs-preis"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.preis}
                  onChange={(e) => setForm({ ...form, preis: e.target.value })}
                  placeholder="z.B. 299.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-dozent">Dozent *</Label>
              <Select value={form.dozent} onValueChange={(v) => setForm({ ...form, dozent: v })}>
                <SelectTrigger id="kurs-dozent">
                  <SelectValue placeholder="Dozent auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {dozenten.map((d) => (
                    <SelectItem key={d.record_id} value={d.record_id}>
                      {d.fields.name} {d.fields.fachgebiet ? `(${d.fields.fachgebiet})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-raum">Raum *</Label>
              <Select value={form.raum} onValueChange={(v) => setForm({ ...form, raum: v })}>
                <SelectTrigger id="kurs-raum">
                  <SelectValue placeholder="Raum auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {raeume.map((r) => (
                    <SelectItem key={r.record_id} value={r.record_id}>
                      {r.fields.raumname} ({r.fields.gebaeude}) – {r.fields.kapazitaet} Plätze
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        title="Kurs löschen"
        description="Möchten Sie diesen Kurs wirklich löschen? Alle zugehörigen Anmeldungen werden ebenfalls betroffen."
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}

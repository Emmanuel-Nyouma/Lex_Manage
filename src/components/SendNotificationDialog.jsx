import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Send, X, Info, AlertTriangle, AlertOctagon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card, Button, Input } from './ui';
import { toast } from 'sonner';
import apiClient from '../lib/api';
import { CreateNotificationSchema, MOTIF_OPTIONS, MOTIF_LEVEL_CONSTRAINTS } from '../lib/schemas/notification.schema';

const SendNotificationDialog = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [isSending, setIsSending] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(CreateNotificationSchema),
    defaultValues: { level: 1, motif: 'INTERNAL_REMINDER', title: '', message: '' }
  });

  const watchLevel = watch('level');
  const watchMotif = watch('motif');

  const handleMotifChange = (motif) => {
    setValue('motif', motif);
    const minLevel = MOTIF_LEVEL_CONSTRAINTS[motif] || 1;
    if (watchLevel < minLevel) {
      setValue('level', minLevel);
      toast.info(`Le niveau a été automatiquement ajusté à ${minLevel} pour le motif sélectionné.`);
    }
  };

  const onSubmit = async (data) => {
    setIsSending(true);
    try {
      await apiClient.post('/notifications', data);
      toast.success("Notification envoyée");
      onClose();
      setStep(1);
    } catch (e) {
      toast.error("Erreur d'envoi");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">Notification - Étape {step}/3</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {[1, 2, 3].map(l => (
              <button key={l} onClick={() => setValue('level', l)} className={`w-full p-4 border rounded-lg ${watchLevel === l ? 'border-amber-500 bg-amber-50' : ''}`}>
                Niveau {l}
              </button>
            ))}
            <Button onClick={() => setStep(2)}>Suivant</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <select onChange={(e) => handleMotifChange(e.target.value)} value={watchMotif} className="w-full p-2 border rounded">
              {MOTIF_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>Précédent</Button>
              <Button onClick={() => setStep(3)}>Suivant</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input {...register('title')} label="Sujet" />
            <textarea {...register('message')} className="w-full p-2 border rounded" placeholder="Message..." />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Précédent</Button>
              <Button type="submit" isLoading={isSending}>Envoyer</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
export default SendNotificationDialog;

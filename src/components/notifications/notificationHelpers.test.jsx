import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Detail, Empty, LevelBadge, NField, NSelect, StatusBadge } from './notificationCenterShared';
import { countdown, fmtDate, motifLabel } from './notificationCenterData';
import { Bell } from 'lucide-react';

describe('notification helpers', () => {
  it('rend les badges connus et leurs replis', () => {
    const { rerender } = render(<LevelBadge level="URGENT" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    rerender(<LevelBadge level="UNKNOWN" />);
    expect(screen.getByText('Normal')).toBeInTheDocument();
    rerender(<StatusBadge status="SENT" />);
    expect(screen.getByText('Sent')).toBeInTheDocument();
    rerender(<StatusBadge status="UNKNOWN" />);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('associe les labels aux champs et transmet leurs changements', () => {
    const change = vi.fn();
    render(<><NField label="Subject" required value="" onChange={change} />
      <NSelect label="Level" value="NORMAL" onChange={change}><option value="NORMAL">Normal</option></NSelect></>);
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Audience' } });
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: 'NORMAL' } });
    expect(screen.getByLabelText('Subject')).toBeRequired();
    expect(change).toHaveBeenCalledTimes(2);
  });

  it('rend les détails et états vides', () => {
    render(<><Detail label="Motif" value="Audience" /><Empty icon={Bell} text="Nothing here" /></>);
    expect(screen.getByText('Audience')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('formate motifs, dates et toutes les branches du compte à rebours', () => {
    expect(motifLabel('HEARING')).not.toBe('HEARING');
    expect(motifLabel('CUSTOM')).toBe('CUSTOM');
    expect(fmtDate('2026-08-20T10:00:00Z')).toMatch(/2026/);
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-20T10:00:00Z').getTime());
    expect(countdown('2026-08-20T09:00:00Z')).toBe('imminente');
    expect(countdown('2026-08-22T12:00:00Z')).toBe('dans 2j 2h');
    expect(countdown('2026-08-20T12:30:00Z')).toBe('dans 2h 30m');
    expect(countdown('2026-08-20T10:45:00Z')).toBe('dans 45 min');
  });
});

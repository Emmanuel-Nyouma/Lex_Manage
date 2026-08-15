import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FirmTab from './FirmTab';

const tenant = {
  name: 'Cabinet Horizon', city: 'Douala', country: 'Cameroun', address: '12 rue de la Justice',
  phone: '+237600000000', fax: '', website: 'https://horizon.example', siret: 'RC-123', barNumber: 'BAR-42',
};

const FirmHarness = ({ onSave = vi.fn(), handleLogoChange = vi.fn(), isSavingFirm = false, logoInputRef = { current: null } }) => {
  const [form, setForm] = useState(tenant);
  const firmField = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });
  return (
    <FirmTab
      logoInputRef={logoInputRef}
      logoPreview="https://assets.example/logo.png"
      isUploadingLogo={false}
      handleLogoChange={handleLogoChange}
      handleSaveFirm={(event) => { event.preventDefault(); onSave(form); }}
      firmField={firmField}
      tenantInfo={tenant}
      setFirmForm={setForm}
      isSavingFirm={isSavingFirm}
    />
  );
};

describe('FirmTab', () => {
  it('rend les informations du cabinet et son logo', () => {
    render(<FirmHarness />);
    expect(screen.getByRole('img', { name: 'Firm logo' })).toHaveAttribute('src', 'https://assets.example/logo.png');
    expect(screen.getByLabelText('Firm Name*')).toHaveValue('Cabinet Horizon');
    expect(screen.getByLabelText('Website')).toHaveValue('https://horizon.example');
    expect(screen.getByLabelText('Bar Number (N° Barreau)')).toHaveValue('BAR-42');
  });

  it('modifie et sauvegarde les informations saisies', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<FirmHarness onSave={onSave} />);
    await user.clear(screen.getByLabelText('Firm Name*'));
    await user.type(screen.getByLabelText('Firm Name*'), 'Cabinet Lex Moderne');
    await user.clear(screen.getByLabelText('City'));
    await user.type(screen.getByLabelText('City'), 'Yaoundé');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cabinet Lex Moderne', city: 'Yaoundé' }));
  });

  it('applique la validation native au nom obligatoire', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<FirmHarness onSave={onSave} />);
    await user.clear(screen.getByLabelText('Firm Name*'));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Firm Name*')).toBeInvalid();
  });

  it('réinitialise les modifications avec les données du tenant', async () => {
    const user = userEvent.setup();
    render(<FirmHarness />);
    await user.clear(screen.getByLabelText('City'));
    await user.type(screen.getByLabelText('City'), 'Kribi');
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByLabelText('City')).toHaveValue('Douala');
  });

  it('transmet le fichier du logo et désactive la sauvegarde en cours', () => {
    const handleLogoChange = vi.fn();
    const { container } = render(<FirmHarness handleLogoChange={handleLogoChange} isSavingFirm />);
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    expect(handleLogoChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });
});

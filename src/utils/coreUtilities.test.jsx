import React, { createRef } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getErrorMessage, getErrorPresentation } from './errorMessages';
import { exportToCSV } from './export';
import { useKeyboardShortcut, useOnClickOutside } from './hooks';
import { getDocumentSignedUrl, softDeleteDocument, uploadLegalDocument } from '../lib/documentService';
import { sanitize } from '../lib/sanitizer';
import { CreateCaseSchema, UpdateCaseSchema } from '../lib/schemas/case.schema';
import { CreateNotificationSchema } from '../lib/schemas/notification.schema';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock('../lib/api', () => ({ default: { get: mocks.get, post: mocks.post, delete: mocks.delete } }));

describe('error presentation', () => {
  it.each([
    [new Error('Failed to fetch dynamically imported module'), 'chunk'],
    [new Error('Network timeout'), 'network'],
    [{ response: { status: 400 } }, 'http-400'],
    [{ response: { status: 401 } }, 'http-401'],
    [{ response: { status: 403 } }, 'http-403'],
    [{ response: { status: 404 } }, 'http-404'],
    [{ response: { status: 409 } }, 'http-409'],
    [{ response: { status: 422 } }, 'http-422'],
    [{ response: { status: 429 } }, 'http-429'],
    [{ response: { status: 503 } }, 'server'],
  ])('classe correctement %j', (error, category) => {
    expect(getErrorPresentation(error).category).toBe(category);
  });

  it('utilise le fallback pour une erreur inconnue', () => {
    expect(getErrorMessage({ name: 'CustomError' }, 'Safe fallback')).toBe('Safe fallback');
  });
});

describe('document services', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne une URL signée ou null en cas d’échec', async () => {
    mocks.get.mockResolvedValueOnce({ data: { url: 'https://signed.example/doc' } });
    await expect(getDocumentSignedUrl('doc-1')).resolves.toBe('https://signed.example/doc');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.get.mockRejectedValueOnce(new Error('offline'));
    await expect(getDocumentSignedUrl('doc-1')).resolves.toBeNull();
  });

  it('supprime un document et propage les erreurs', async () => {
    mocks.delete.mockResolvedValueOnce({});
    await expect(softDeleteDocument('doc-1')).resolves.toBe(true);
    const error = new Error('forbidden');
    mocks.delete.mockRejectedValueOnce(error);
    await expect(softDeleteDocument('doc-2')).rejects.toBe(error);
  });

  it('construit le formulaire multipart avec métadonnées et dossier', async () => {
    mocks.post.mockResolvedValueOnce({ data: { id: 'doc-1' } });
    const file = new File(['content'], 'contract.pdf', { type: 'application/pdf' });
    await expect(uploadLegalDocument(file, { id: 'user-1' }, { category: 'Contrats', subCategory: 'Bail', allowedRoles: ['LAWYER'] }, 'case-1')).resolves.toEqual({ id: 'doc-1' });
    const formData = mocks.post.mock.calls[0][1];
    expect(formData.get('file')).toBe(file);
    expect(formData.get('category')).toBe('Contrats');
    expect(formData.get('allowedRoles')).toBe('["LAWYER"]');
    expect(formData.get('caseId')).toBe('case-1');
  });
});

describe('browser utilities and validation', () => {
  it('assainit le HTML dangereux', () => {
    expect(sanitize('<img src=x onerror=alert(1)><strong>Safe</strong>')).toBe('<img src="x"><strong>Safe</strong>');
  });

  it('valide les contrats de création et mise à jour', () => {
    expect(CreateCaseSchema.safeParse({ title: 'A' }).success).toBe(false);
    expect(CreateCaseSchema.parse({ title: 'Matter' })).toEqual(expect.objectContaining({ status: 'OPEN', priority: 'MEDIUM' }));
    expect(UpdateCaseSchema.safeParse({ status: 'INVALID' }).success).toBe(false);
    expect(CreateNotificationSchema.safeParse({ levelNum: 1, level: 'NORMAL', motif: 'HEARING' }).success).toBe(false);
    expect(CreateNotificationSchema.safeParse({ levelNum: 2, level: 'IMPORTANT', motif: 'HEARING' }).success).toBe(true);
  });

  it('exporte les données en CSV et ignore une liste vide', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURL = vi.fn(() => 'blob:csv');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    exportToCSV([], 'empty.csv');
    expect(createObjectURL).not.toHaveBeenCalled();
    exportToCSV([{ name: 'Alice', note: 'He said "yes"' }], 'users.csv');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });

  it('déclenche les raccourcis clavier configurés', () => {
    const callback = vi.fn();
    renderHook(() => useKeyboardShortcut('k', callback));
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    act(() => window.dispatchEvent(event));
    expect(callback).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('détecte uniquement les clics hors de la référence', () => {
    const ref = createRef();
    const handler = vi.fn();
    render(<div><div ref={ref}>inside</div><button>outside</button></div>);
    renderHook(() => useOnClickOutside(ref, handler));
    act(() => ref.current.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(handler).not.toHaveBeenCalled();
    act(() => document.querySelector('button').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    expect(handler).toHaveBeenCalledOnce();
  });
});

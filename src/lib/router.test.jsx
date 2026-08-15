import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from './router';

const ClientPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  return <p>Client {id}, onglet {params.get('tab')}</p>;
};

describe('router interne', () => {
  it('résout les paramètres de route et de recherche', () => {
    window.history.replaceState(null, '', '/clients/client%201?tab=documents');
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/clients/:id" element={<ClientPage />} />
        </Routes>
      </BrowserRouter>,
    );

    expect(screen.getByText('Client client 1, onglet documents')).toBeInTheDocument();
  });

  it('navigue sans recharger la page et gère la redirection replace', async () => {
    render(
      <BrowserRouter>
        <Link to="/protected">Ouvrir</Link>
        <Routes>
          <Route path="/" element={<p>Accueil</p>} />
          <Route path="/protected" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<p>Connexion</p>} />
        </Routes>
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Ouvrir' }));
    await waitFor(() => expect(screen.getByText('Connexion')).toBeInTheDocument());
    expect(window.location.pathname).toBe('/login');
  });

  it('utilise la route joker pour une URL inconnue', () => {
    window.history.replaceState(null, '', '/inconnue');
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<p>Tableau de bord</p>} />
          <Route path="*" element={<p>Page introuvable</p>} />
        </Routes>
      </BrowserRouter>,
    );

    expect(screen.getByText('Page introuvable')).toBeInTheDocument();
  });
});

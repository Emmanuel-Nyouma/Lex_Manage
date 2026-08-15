import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingScreen, { ONBOARDING_STORAGE_KEY } from './OnboardingScreen';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setLanguage: vi.fn(),
  state: { language: 'en' },
}));

vi.mock('../lib/router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../store/useLexStore', () => ({
  default: (selector) => selector({
    language: mocks.state.language,
    setLanguage: mocks.setLanguage,
  }),
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.state.language = 'en';
  });

  it('parcourt les écrans avec les contrôles, le clavier et les gestes', () => {
    render(<OnboardingScreen />);
    expect(screen.getByRole('heading', { name: 'Your firm, better organized.' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Run every matter without missing a detail.' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: 'Run every matter without missing a detail.' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    const main = screen.getByRole('main');
    fireEvent.touchStart(main, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(main, { changedTouches: [{ clientX: 100 }] });
    expect(screen.getByRole('heading', { name: 'Run every matter without missing a detail.' })).toBeInTheDocument();
    fireEvent.touchStart(main, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(main, { changedTouches: [{ clientX: 200 }] });
    expect(screen.getByRole('heading', { name: 'Your firm, better organized.' })).toBeInTheDocument();
  });

  it('termine le parcours en connexion ou création de cabinet', () => {
    const { unmount } = render(<OnboardingScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });

    unmount();
    vi.clearAllMocks();
    render(<OnboardingScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Screen 5' }));
    expect(screen.getByRole('heading', { name: 'Make decisions with the right information.' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create my firm' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/login?mode=signup', { replace: true });
  });

  it('termine le dernier écran et change la langue', () => {
    render(<OnboardingScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Passer en français' }));
    expect(mocks.setLanguage).toHaveBeenCalledWith('fr');

    fireEvent.click(screen.getByRole('button', { name: 'Screen 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});

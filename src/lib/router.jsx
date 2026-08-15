import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const RouterContext = createContext(null);
const ParamsContext = createContext({});

const readLocation = () => ({
  pathname: window.location.pathname || '/',
  search: window.location.search,
  hash: window.location.hash,
});

const normalizePath = (path) => {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
};

const matchPath = (pattern, pathname) => {
  if (pattern === '*') return {};

  const patternParts = normalizePath(pattern).split('/').filter(Boolean);
  const pathParts = normalizePath(pathname).split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];
    if (expected.startsWith(':')) {
      try {
        params[expected.slice(1)] = decodeURIComponent(actual);
      } catch {
        return null;
      }
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
};

export const BrowserRouter = ({ children }) => {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const handlePopState = () => setLocation(readLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((destination, options = {}) => {
    if (typeof destination === 'number') {
      window.history.go(destination);
      return;
    }

    const nextUrl = new URL(destination, window.location.origin);
    if (nextUrl.origin !== window.location.origin) {
      throw new Error('Navigation externe refusée par le routeur interne.');
    }

    const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history[options.replace ? 'replaceState' : 'pushState'](options.state ?? null, '', next);
    setLocation(readLocation());
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

const useRouter = () => {
  const router = useContext(RouterContext);
  if (!router) throw new Error('Le routeur doit être utilisé dans BrowserRouter.');
  return router;
};

export const useNavigate = () => useRouter().navigate;
export const useLocation = () => useRouter().location;
export const useParams = () => useContext(ParamsContext);

export const useSearchParams = () => {
  const { location, navigate } = useRouter();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setParams = useCallback((nextValue, options) => {
    const nextParams = typeof nextValue === 'function'
      ? nextValue(new URLSearchParams(location.search))
      : nextValue;
    const query = new URLSearchParams(nextParams).toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}${location.hash}`, options);
  }, [location, navigate]);
  return [params, setParams];
};

export const Route = () => null;

export const Routes = ({ children }) => {
  const { location } = useRouter();
  let fallback = null;

  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue;
    if (child.props.path === '*') {
      fallback = child;
      continue;
    }
    const params = matchPath(child.props.path, location.pathname);
    if (params) {
      return <ParamsContext.Provider value={params}>{child.props.element}</ParamsContext.Provider>;
    }
  }

  return fallback
    ? <ParamsContext.Provider value={{}}>{fallback.props.element}</ParamsContext.Provider>
    : null;
};

export const Navigate = ({ to, replace = false, state }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);
  return null;
};

const shouldHandleInternally = (event, target) => (
  !event.defaultPrevented
  && event.button === 0
  && !event.metaKey
  && !event.ctrlKey
  && !event.shiftKey
  && !event.altKey
  && (!target || target === '_self')
);

export const Link = forwardRef(function Link(
  { to, replace = false, state, onClick, target, children, ...props },
  ref,
) {
  const navigate = useNavigate();
  const handleClick = (event) => {
    onClick?.(event);
    if (!shouldHandleInternally(event, target)) return;
    event.preventDefault();
    navigate(to, { replace, state });
  };

  return (
    <a ref={ref} href={to} target={target} onClick={handleClick} {...props}>
      {children}
    </a>
  );
});

export const NavLink = forwardRef(function NavLink(
  { to, className, children, ...props },
  ref,
) {
  const { pathname } = useLocation();
  const isActive = normalizePath(pathname) === normalizePath(to);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link
      ref={ref}
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={resolvedClassName}
      {...props}
    >
      {resolvedChildren}
    </Link>
  );
});

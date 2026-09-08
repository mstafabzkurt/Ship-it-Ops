import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  checkCompanyNameAvailability,
  type CompanyNameAvailabilityStatus,
} from '../services/companyName';
import {
  normalizeCompanyNameDisplay,
  validateCompanyName,
} from '../utils/companyNameValidation';

interface UseCompanyNameAvailabilityOptions {
  currentCompanyName?: string | null;
  debounceMs?: number;
  enabled?: boolean;
}

interface AvailabilityState {
  status: CompanyNameAvailabilityStatus;
  message: string;
  checkedInput: string | null;
}

export function canSubmitCompanyName(
  status: CompanyNameAvailabilityStatus,
  checkedInput: string | null,
  currentInput: string,
): boolean {
  return status === 'available' && checkedInput === currentInput;
}

export function useCompanyNameAvailability(
  value: string,
  options: UseCompanyNameAvailabilityOptions = {},
) {
  const { currentCompanyName = null, debounceMs = 500, enabled = true } = options;
  const validation = useMemo(() => validateCompanyName(value), [value]);
  const requestGeneration = useRef(0);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [state, setState] = useState<AvailabilityState>({
    status: 'idle',
    message: '',
    checkedInput: null,
  });

  useEffect(() => {
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    let cancelled = false;

    if (!enabled) {
      setState({ status: 'idle', message: '', checkedInput: null });
      return undefined;
    }
    if (!validation.isValid) {
      setState({ status: 'invalid', message: validation.message, checkedInput: value });
      return undefined;
    }
    if (
      currentCompanyName !== null
      && validation.displayName === normalizeCompanyNameDisplay(currentCompanyName)
    ) {
      setState({ status: 'available', message: 'Bu şirket adı alınabilir.', checkedInput: value });
      return undefined;
    }

    setState({ status: 'checking', message: 'Şirket adı kontrol ediliyor...', checkedInput: null });
    const timer = setTimeout(() => {
      void checkCompanyNameAvailability(value).then((result) => {
        if (cancelled || requestGeneration.current !== generation) return;
        setState({ status: result.status, message: result.message, checkedInput: value });
      });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentCompanyName, debounceMs, enabled, retryGeneration, validation, value]);

  const retry = useCallback(() => setRetryGeneration((current) => current + 1), []);
  const markSaved = useCallback((displayName: string) => {
    setState({ status: 'saved', message: 'Şirket adı kaydedildi.', checkedInput: displayName });
  }, []);

  return {
    ...state,
    validation,
    displayName: validation.displayName,
    canSave: canSubmitCompanyName(state.status, state.checkedInput, value),
    retry,
    markSaved,
  };
}

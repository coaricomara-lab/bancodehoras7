import { doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { db, logFirestoreError, OperationType } from './firebase';
import { InstitutionSettings, DEFAULT_INSTITUTION_SETTINGS } from '../types/institutionConfig';

const COLLECTION = 'institution_settings';
const DOC_ID = 'current';

function sanitize(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) clean[k] = obj[k];
  }
  return clean;
}

export const institutionService = {
  subscribe(
    onSuccess: (settings: InstitutionSettings) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    try {
      return onSnapshot(
        doc(db, COLLECTION, DOC_ID),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<InstitutionSettings>;
            onSuccess({
              ...DEFAULT_INSTITUTION_SETTINGS,
              ...data,
              horarios: { ...DEFAULT_INSTITUTION_SETTINGS.horarios, ...data.horarios },
              regrasCalculo: { ...DEFAULT_INSTITUTION_SETTINGS.regrasCalculo, ...data.regrasCalculo },
              documentosModelo: { ...DEFAULT_INSTITUTION_SETTINGS.documentosModelo, ...data.documentosModelo },
              cargos: data.cargos || DEFAULT_INSTITUTION_SETTINGS.cargos,
              sedes: data.sedes || DEFAULT_INSTITUTION_SETTINGS.sedes,
            } as InstitutionSettings);
          } else {
            onSuccess(DEFAULT_INSTITUTION_SETTINGS);
          }
        },
        (error) => {
          logFirestoreError(error, OperationType.GET, `${COLLECTION}/${DOC_ID}`);
          if (onError) onError(error);
          onSuccess(DEFAULT_INSTITUTION_SETTINGS);
        },
      );
    } catch (err: any) {
      logFirestoreError(err, OperationType.GET, `${COLLECTION}/${DOC_ID}`);
      if (onError) onError(err);
      onSuccess(DEFAULT_INSTITUTION_SETTINGS);
      return () => {};
    }
  },

  async save(settings: InstitutionSettings, updatedBy: string): Promise<void> {
    const now = new Date().toISOString();
    const payload = sanitize({ ...settings, atualizadoEm: now, atualizadoPor: updatedBy });
    try {
      await setDoc(doc(db, COLLECTION, DOC_ID), payload, { merge: true });
    } catch (err) {
      logFirestoreError(err, OperationType.WRITE, `${COLLECTION}/${DOC_ID}`);
      throw err;
    }
  },
};

import { FirestoreErrorInfo, OperationType } from '../types';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: null,
    operationType,
    path
  }
  console.error('API Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

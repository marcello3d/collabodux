import { Client } from './client';
import { useEffect, useState } from 'react';
import { ModelState } from '../shared/model';

export function useClientLocalState(client: Client<ModelState>) {
  const [ localState, setLocalState ] = useState<ModelState>(client.localState);
  useEffect(() => client.subscribe(setLocalState), [ client ])
  return localState;
}

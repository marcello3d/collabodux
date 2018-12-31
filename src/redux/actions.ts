import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory();

export const setTitle = actionCreator<{
  title: string
}>('SET_TITLE');


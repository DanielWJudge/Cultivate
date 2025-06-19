import { act } from 'react-dom/test-utils';

export async function actClick(element: HTMLElement) {
  await act(async () => {
    element.click();
  });
}

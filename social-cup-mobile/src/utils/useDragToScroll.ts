import { Platform } from 'react-native';

// react-native-web's ScrollView only reacts to touch/trackpad/wheel input,
// not mouse click-and-drag — so on a laptop browser a horizontal carousel
// looks inert unless you happen to use a trackpad. This adds native-style
// click-and-drag scrolling on web only; it's a no-op on iOS/Android where
// ScrollView already tracks the touch gesture directly.
export function useDragToScroll() {
  if (Platform.OS !== 'web') {
    return {};
  }

  let startX = 0;
  let startScrollLeft = 0;
  let node: HTMLElement | null = null;

  const onMove = (e: MouseEvent) => {
    if (!node) return;
    e.preventDefault();
    node.scrollLeft = startScrollLeft - (e.pageX - startX);
  };

  const stopDrag = () => {
    if (node) node.style.cursor = 'grab';
    document.body.style.removeProperty('user-select');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', stopDrag);
    node = null;
  };

  const onMouseDown = (e: any) => {
    node = e.currentTarget as HTMLElement;
    startX = e.pageX;
    startScrollLeft = node.scrollLeft;
    node.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
  };

  return {
    onMouseDown,
    style: { cursor: 'grab' } as any,
  };
}

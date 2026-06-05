export function Toast({ text, show }: { text: string; show: boolean }) {
  return <div className={`zh-bs-toast${show ? ' show' : ''}`}>{text}</div>;
}

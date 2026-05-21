import { FadeUp } from '@zhic/ui';
import { RichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';
import styles from './CategoryIntro.module.css';

export type CategoryIntroProps = {
  intro: LexicalRoot | null | undefined;
  variant: 'leaf' | 'parent';
};

export function CategoryIntro({ intro, variant }: CategoryIntroProps) {
  if (!intro?.root?.children?.length) return null;
  const cls = variant === 'parent' ? `${styles.wrap} ${styles.parent}` : styles.wrap;
  return (
    <FadeUp as="section" className={cls}>
      <RichText value={intro} />
    </FadeUp>
  );
}

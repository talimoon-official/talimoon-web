/**
 * The Hall — Story Library landing.
 * ----------------------------------------------------------------
 * One curated entry, then the two worlds introduced editorially:
 *
 *   rotating showcase hero
 *           →  World I: Family Stories (warm mantel cluster)
 *           →  World II: Yusuf & Yasmina (the numbered spine)
 *           →  "Most loved this month" (hidden until real engagement)
 *
 * Every band a different shape. Built to read as intentional
 * curation at 5 books and to scale to hundreds unchanged. Flows
 * straight into the site Footer — no CTA banner.
 */

import { getHallData } from '@/lib/story-library/content';
import { Band } from './shared';
import { StoryLibraryHero } from './StoryLibraryHero';
import { FamilyStoriesWorld } from './FamilyStoriesWorld';
import { YusufYasminaSpine } from './YusufYasminaSpine';
import { WordsLeftPreview } from './WordsLeftPreview';
import { MostLovedStrip } from './MostLovedStrip';

export function Hall() {
  const data = getHallData();

  return (
    <>
      <StoryLibraryHero />

      <Band tone="raised" className="py-20 md:py-28">
        <FamilyStoriesWorld stories={data.family} />
      </Band>

      <Band className="py-20 md:py-28 lg:py-32">
        {data.series ? (
          <YusufYasminaSpine
            series={data.series.series}
            episodes={data.series.episodes}
          />
        ) : null}
      </Band>

      {/* Self-hides until at least one Voice Memory is published. */}
      <WordsLeftPreview />

      <MostLovedStrip stories={data.mostLoved} />
    </>
  );
}

export default Hall;

import React from "react";
import { Composition } from "remotion";
import "./fonts.css";
import { ShortsMain } from "./compositions/Shorts";
import { shortsTestSpec } from "./data/shorts-test-spec";
import { StillBeatsMain } from "./compositions/StillBeats";
import { stickmanTestSpec } from "./data/stickman-test-spec";
import { KenBurnsMain } from "./compositions/KenBurns";
import { illustratedTestSpec } from "./data/illustrated-test-spec";
import { KeplerMain } from "./compositions/Kepler";
import { HowItFeelsTrial } from "./compositions/HowItFeelsTrial";
import { BridgeShort } from "./compositions/bridge/Bridge";
import { FryCookMromidev } from "./compositions/frycook/FryCook";

// Phase C: the frozen design system lives in src/design/ (tokens, Bot,
// Chip/Tag/Caption/Label, SlideBridge, Karaoke, Camera, Ambience,
// FlatScene, Overlays). Compositions take a SPEC as props — workers
// write data, never TSX per video.
//
// Phase D lesson (proven by a failed render): the CLI REJECTS a frame
// range outside the composition's durationInFrames — props can change
// content, but they cannot extend the registered length. So production
// compositions below declare a generous UPPER BOUND (10800 frames =
// 360 s, covering any Shorts or Long chapter) and the worker renders
// only the exact range its spec needs (--frames=0-<N-1>). The declared
// frames beyond the range are never rendered. Test compositions keep
// their exact test durations and are not touched.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortsTest"
        component={ShortsMain}
        defaultProps={{ spec: shortsTestSpec }}
        durationInFrames={242}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="StickmanTest"
        component={StillBeatsMain}
        defaultProps={{ spec: stickmanTestSpec }}
        durationInFrames={405}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="IllustratedTest"
        component={KenBurnsMain}
        defaultProps={{ spec: illustratedTestSpec }}
        durationInFrames={1334}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Shorts"
        component={ShortsMain}
        defaultProps={{ spec: shortsTestSpec }}
        durationInFrames={10800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="StillBeats"
        component={StillBeatsMain}
        defaultProps={{ spec: stickmanTestSpec }}
        durationInFrames={10800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="KenBurns"
        component={KenBurnsMain}
        defaultProps={{ spec: illustratedTestSpec }}
        durationInFrames={10800}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Kepler-22b conversion (one-off, NOT a pipeline path): 60 s, 15
          scenes, gsap camera timeline + raw Whisper karaoke. KeplerGsap
          is the flat main variant; KeplerThree swaps scene 4's Kepler
          disc for a real 3D sphere via @remotion/three. */}
      <Composition
        id="KeplerGsap"
        component={KeplerMain}
        defaultProps={{ three: false }}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="KeplerThree"
        component={KeplerMain}
        defaultProps={{ three: true }}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* "How it feels" trial (one-off, 2026-11-22): low-poly 3D fry
          station, 12 s, third-person gliding camera. NOT a pipeline
          path — a look test for the niche. */}
      <Composition
        id="HowItFeelsTrial"
        component={HowItFeelsTrial}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* mromidev trial #2 (one-off, 2026-11-22): "cartoon 3D" template
          (templates/bridge/ from mromidev/claude-animated-shorts, MIT),
          67.5 s / 2025 frames. NOT a pipeline path — a look test to
          verify the template renders on our stack. Kenney GLB props
          are absent (public/bridge/kenney/ not populated); loadKit
          falls back gracefully, so trees/lanterns/stalls are missing. */}
      <Composition
        id="BridgeTrial"
        component={BridgeShort}
        durationInFrames={2025}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Fry cook in the mromidev style (one-off, 2026-11-22): the trial #1
          fry station rebuilt on the mromidev template's engine (billboard
          worker, ink + DOF + grade post chain), 60 s / 1800 frames, no
          audio. NOT a pipeline path — a look test. */}
      <Composition
        id="FryCookMromidev"
        component={FryCookMromidev}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

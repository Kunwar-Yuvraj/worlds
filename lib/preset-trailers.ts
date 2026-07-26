export type PresetTrailer = {
  id: string;
  title: string;
  fileName: string;
};

export const PRESET_TRAILERS: Record<string, PresetTrailer> = {
  'Murder at Glasshouse Manor': {
    id: 'glasshouse-manor',
    title: 'Murder at Glasshouse Manor',
    fileName: 'GlassHouseManor.mp4',
  },
  'The Last Order of 1891': {
    id: 'last-order-1891',
    title: 'The Last Order of 1891',
    fileName: 'LastOrder1891.mp4',
  },
  'The Midnight Debate Club': {
    id: 'midnight-debate-club',
    title: 'The Midnight Debate Club',
    fileName: 'MidnightDebateClub.mp4',
  },
  'The Aurora Express Job': {
    id: 'aurora-express-job',
    title: 'The Aurora Express Job',
    fileName: 'TheAuroraOfExpressJob.mp4',
  },
};

export const PRESET_TRAILERS_BY_ID = Object.values(PRESET_TRAILERS).reduce<Record<string, PresetTrailer>>(
  (trailers, trailer) => ({ ...trailers, [trailer.id]: trailer }),
  {},
);

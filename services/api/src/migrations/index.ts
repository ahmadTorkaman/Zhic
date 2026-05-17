import * as migration_20260505_233650_initial from './20260505_233650_initial';
import * as migration_20260516_224611_add_design_editorial_fields from './20260516_224611_add_design_editorial_fields';
import * as migration_20260517_023800_extend_piece_type_enum from './20260517_023800_extend_piece_type_enum';
import * as migration_20260517_114048_add_design_slider_media from './20260517_114048_add_design_slider_media';

export const migrations = [
  {
    up: migration_20260505_233650_initial.up,
    down: migration_20260505_233650_initial.down,
    name: '20260505_233650_initial'
  },
  {
    up: migration_20260516_224611_add_design_editorial_fields.up,
    down: migration_20260516_224611_add_design_editorial_fields.down,
    name: '20260516_224611_add_design_editorial_fields'
  },
  {
    up: migration_20260517_023800_extend_piece_type_enum.up,
    down: migration_20260517_023800_extend_piece_type_enum.down,
    name: '20260517_023800_extend_piece_type_enum'
  },
  {
    up: migration_20260517_114048_add_design_slider_media.up,
    down: migration_20260517_114048_add_design_slider_media.down,
    name: '20260517_114048_add_design_slider_media'
  },
];

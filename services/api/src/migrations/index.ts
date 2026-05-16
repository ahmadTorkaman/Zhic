import * as migration_20260505_233650_initial from './20260505_233650_initial';
import * as migration_20260516_224611_add_design_editorial_fields from './20260516_224611_add_design_editorial_fields';

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
];

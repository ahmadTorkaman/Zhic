import * as migration_20260505_233650_initial from './20260505_233650_initial';
import * as migration_20260516_224611_add_design_editorial_fields from './20260516_224611_add_design_editorial_fields';
import * as migration_20260517_023800_extend_piece_type_enum from './20260517_023800_extend_piece_type_enum';
import * as migration_20260517_114048_add_design_slider_media from './20260517_114048_add_design_slider_media';
import * as migration_20260519_041500_create_rooms from './20260519_041500_create_rooms';
import * as migration_20260519_221500_add_site_config_subscribers_hero_slides from './20260519_221500_add_site_config_subscribers_hero_slides';
import * as migration_20260519_222500_add_rooms_subscribers_to_locked_documents_rels from './20260519_222500_add_rooms_subscribers_to_locked_documents_rels';
import * as migration_20260521_180000_add_category_hub_fields from './20260521_180000_add_category_hub_fields';
import * as migration_20260522_150000_create_product_variants from './20260522_150000_create_product_variants';
import * as migration_20260522_153000_extend_inquiries_with_variant from './20260522_153000_extend_inquiries_with_variant';
import * as migration_20260522_220000_add_warranty_years_to_products from './20260522_220000_add_warranty_years_to_products';
import * as migration_20260522_221000_fix_price_delta_rials_type from './20260522_221000_fix_price_delta_rials_type';
import * as migration_20260523_120000_add_occupancies_and_axis_filter from './20260523_120000_add_occupancies_and_axis_filter';
import * as migration_20260529_210000_swap_subscribers_email_to_phone from './20260529_210000_swap_subscribers_email_to_phone';
import * as migration_20260530_200000_add_after_sales_years_to_products from './20260530_200000_add_after_sales_years_to_products';
import * as migration_20260530_220000_add_products_occupancies from './20260530_220000_add_products_occupancies';
import * as migration_20260605_120000_add_home_about_media from './20260605_120000_add_home_about_media';
import * as migration_20260606_120000_add_bedroom_set_fields from './20260606_120000_add_bedroom_set_fields';
import * as migration_20260615_120000_add_bedroom_set_intros from './20260615_120000_add_bedroom_set_intros';
import * as migration_20260617_120000_add_design_detail_fields from './20260617_120000_add_design_detail_fields';
import * as migration_20260618_120000_create_journal_global from './20260618_120000_create_journal_global';
import * as migration_20260618_130000_create_bedroom_furniture_global from './20260618_130000_create_bedroom_furniture_global';
import * as migration_20260621_120000_add_bedroom_set_occupancy_heroes from './20260621_120000_add_bedroom_set_occupancy_heroes';
import * as migration_20260625_120000_create_bedroom_set_hubs from './20260625_120000_create_bedroom_set_hubs';
import * as migration_20260625_120000_add_home_about_background from './20260625_120000_add_home_about_background';
import * as migration_20260625_130000_create_series_occupancies from './20260625_130000_create_series_occupancies';
import * as migration_20260625_140000_register_bedroom_set_hubs_locked_docs from './20260625_140000_register_bedroom_set_hubs_locked_docs';
import * as migration_20260626_120000_rename_xids_relationship_paths from './20260626_120000_rename_xids_relationship_paths';
import * as migration_20260626_130000_add_status_seo_to_designs_showrooms_hubs from './20260626_130000_add_status_seo_to_designs_showrooms_hubs';

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
  {
    up: migration_20260519_041500_create_rooms.up,
    down: migration_20260519_041500_create_rooms.down,
    name: '20260519_041500_create_rooms'
  },
  {
    up: migration_20260519_221500_add_site_config_subscribers_hero_slides.up,
    down: migration_20260519_221500_add_site_config_subscribers_hero_slides.down,
    name: '20260519_221500_add_site_config_subscribers_hero_slides'
  },
  {
    up: migration_20260519_222500_add_rooms_subscribers_to_locked_documents_rels.up,
    down: migration_20260519_222500_add_rooms_subscribers_to_locked_documents_rels.down,
    name: '20260519_222500_add_rooms_subscribers_to_locked_documents_rels'
  },
  {
    up: migration_20260521_180000_add_category_hub_fields.up,
    down: migration_20260521_180000_add_category_hub_fields.down,
    name: '20260521_180000_add_category_hub_fields'
  },
  {
    up: migration_20260522_150000_create_product_variants.up,
    down: migration_20260522_150000_create_product_variants.down,
    name: '20260522_150000_create_product_variants'
  },
  {
    up: migration_20260522_153000_extend_inquiries_with_variant.up,
    down: migration_20260522_153000_extend_inquiries_with_variant.down,
    name: '20260522_153000_extend_inquiries_with_variant'
  },
  {
    up: migration_20260522_220000_add_warranty_years_to_products.up,
    down: migration_20260522_220000_add_warranty_years_to_products.down,
    name: '20260522_220000_add_warranty_years_to_products'
  },
  {
    up: migration_20260522_221000_fix_price_delta_rials_type.up,
    down: migration_20260522_221000_fix_price_delta_rials_type.down,
    name: '20260522_221000_fix_price_delta_rials_type'
  },
  {
    up: migration_20260523_120000_add_occupancies_and_axis_filter.up,
    down: migration_20260523_120000_add_occupancies_and_axis_filter.down,
    name: '20260523_120000_add_occupancies_and_axis_filter'
  },
  {
    up: migration_20260529_210000_swap_subscribers_email_to_phone.up,
    down: migration_20260529_210000_swap_subscribers_email_to_phone.down,
    name: '20260529_210000_swap_subscribers_email_to_phone'
  },
  {
    up: migration_20260530_200000_add_after_sales_years_to_products.up,
    down: migration_20260530_200000_add_after_sales_years_to_products.down,
    name: '20260530_200000_add_after_sales_years_to_products'
  },
  {
    up: migration_20260530_220000_add_products_occupancies.up,
    down: migration_20260530_220000_add_products_occupancies.down,
    name: '20260530_220000_add_products_occupancies'
  },
  {
    up: migration_20260605_120000_add_home_about_media.up,
    down: migration_20260605_120000_add_home_about_media.down,
    name: '20260605_120000_add_home_about_media'
  },
  {
    up: migration_20260606_120000_add_bedroom_set_fields.up,
    down: migration_20260606_120000_add_bedroom_set_fields.down,
    name: '20260606_120000_add_bedroom_set_fields'
  },
  {
    up: migration_20260615_120000_add_bedroom_set_intros.up,
    down: migration_20260615_120000_add_bedroom_set_intros.down,
    name: '20260615_120000_add_bedroom_set_intros'
  },
  {
    up: migration_20260617_120000_add_design_detail_fields.up,
    down: migration_20260617_120000_add_design_detail_fields.down,
    name: '20260617_120000_add_design_detail_fields'
  },
  {
    up: migration_20260618_120000_create_journal_global.up,
    down: migration_20260618_120000_create_journal_global.down,
    name: '20260618_120000_create_journal_global'
  },
  {
    up: migration_20260618_130000_create_bedroom_furniture_global.up,
    down: migration_20260618_130000_create_bedroom_furniture_global.down,
    name: '20260618_130000_create_bedroom_furniture_global'
  },
  {
    up: migration_20260621_120000_add_bedroom_set_occupancy_heroes.up,
    down: migration_20260621_120000_add_bedroom_set_occupancy_heroes.down,
    name: '20260621_120000_add_bedroom_set_occupancy_heroes'
  },
  {
    up: migration_20260625_120000_create_bedroom_set_hubs.up,
    down: migration_20260625_120000_create_bedroom_set_hubs.down,
    name: '20260625_120000_create_bedroom_set_hubs'
  },
  {
    up: migration_20260625_120000_add_home_about_background.up,
    down: migration_20260625_120000_add_home_about_background.down,
    name: '20260625_120000_add_home_about_background'
  },
  {
    up: migration_20260625_130000_create_series_occupancies.up,
    down: migration_20260625_130000_create_series_occupancies.down,
    name: '20260625_130000_create_series_occupancies'
  },
  {
    up: migration_20260625_140000_register_bedroom_set_hubs_locked_docs.up,
    down: migration_20260625_140000_register_bedroom_set_hubs_locked_docs.down,
    name: '20260625_140000_register_bedroom_set_hubs_locked_docs'
  },
  {
    up: migration_20260626_120000_rename_xids_relationship_paths.up,
    down: migration_20260626_120000_rename_xids_relationship_paths.down,
    name: '20260626_120000_rename_xids_relationship_paths'
  },
  {
    up: migration_20260626_130000_add_status_seo_to_designs_showrooms_hubs.up,
    down: migration_20260626_130000_add_status_seo_to_designs_showrooms_hubs.down,
    name: '20260626_130000_add_status_seo_to_designs_showrooms_hubs'
  },
];

with inserted_items as (
  insert into catalog_items (category, name_zh, name_en, meta, is_active)
  values
    -- membership
    ('membership','日卡','Day Pass','{"billing_cycle":"day"}',true),
    ('membership','周卡','Week Pass','{"billing_cycle":"week"}',true),
    ('membership','月卡','Monthly Membership','{"billing_cycle":"month"}',true),
    ('membership','年卡','Annual Membership','{"note":"年卡每个月支付99","note_en":"Annual membership billed at 99 per month","billing_cycle":"month","plan_length_months":12}',true),
    ('membership','激活费','Activation Fee','{"one_time":true}',true),

    -- group class
    ('group_class','单次课程','Single Class','{}',true),
    ('group_class','单周通行','Weekly Pass','{}',true),
    ('group_class','月度通行','Monthly Pass','{}',true),

    -- stored value
    ('stored_value','储值卡3000','Stored Value 3000','{"gift_amount":300,"gift_membership":"1个月","gift_membership_en":"1-Month Membership","gift_total_value":595}',true),
    ('stored_value','储值卡6000','Stored Value 6000','{"gift_amount":600,"gift_membership":"6个月","gift_membership_en":"6-Month Membership","gift_total_value":1314}',true),
    ('stored_value','储值卡9000','Stored Value 9000','{"gift_amount":1500,"gift_membership":"1年","gift_membership_en":"1-Year Membership","gift_total_value":3161}',true),

    -- cycle plans
    ('cycle_plan','6周计划','6-Week Program','{"weeks":6,"min_sessions":12,"sessions_per_week":"2-4"}',true),
    ('cycle_plan','12周计划','12-Week Program','{"weeks":12,"min_sessions":24,"sessions_per_week":"2-4"}',true),
    ('cycle_plan','24周计划','24-Week Program','{"weeks":24,"min_sessions":48,"sessions_per_week":"2-4"}',true),

    -- assessments
    ('assessment','饮食评估和饮食计划设计','Personal Nutrition Assessment and Planning','{"focus":"饮食评估与饮食计划设计","focus_en":"Personal nutrition assessment and planning"}',true),
    ('assessment','专业身体评估与周期计划','Professional Personal Wellness Consulation & Wellness Program provideed by our Wellness program Director','{"focus":"专业身体评估与周期计划制定","focus_en":"Professional wellness consultation and phased plan"}',true),

    -- personal training programs
    ('personal_training','基础力量训练','Foundational Fitness','{"focus":"建立力量与稳定性","focus_en":"Build strength, stability, and movement foundation","target":"新手","target_en":"Beginners / Long-term inactive clients"}',true),
    ('personal_training','体型重塑','Body Recomposition','{"focus":"减脂塑形","focus_en":"Fat loss with muscle maintenance and body shaping","target":"想瘦/增肌","target_en":"Weight loss / Body shaping goals"}',true),
    ('personal_training','拳击体能','Boxing Conditioning','{"focus":"提升心肺","focus_en":"Improve cardio and release stress","target":"高压力","target_en":"High stress / Boxing lovers"}',true),
    ('personal_training','体态矫正','Posture Correction','{"focus":"改善姿态","focus_en":"Correct muscle imbalance and posture alignment","target":"圆肩等","target_en":"Rounded shoulders / Pelvic issues"}',true),
    ('personal_training','功能训练','Functional Training','{"focus":"提升灵活性","focus_en":"Improve daily movement quality and mobility","target":"久坐","target_en":"Sedentary / Limited mobility"}',true),
    ('personal_training','疼痛管理','Pain Management','{"focus":"缓解疼痛","focus_en":"Reduce chronic pain and prevent injury","target":"慢性不适","target_en":"Shoulder / Back / Knee pain"}',true),
    ('personal_training','孕期产后','Pre/Post Natal','{"focus":"安全恢复","focus_en":"Safe training for pregnancy and recovery","target":"孕期产后","target_en":"Pregnancy / Postpartum clients"}',true)
  returning id, category, name_zh
)

insert into catalog_variants (item_id, member_type, session_mode, price, currency, meta, is_active)
select id, null, 'single', 35, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='日卡'
union all
select id, null, 'weekly_pass', 99, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='周卡'
union all
select id, null, 'monthly_pass', 175, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='月卡'
union all
select id, null, 'annual_pass', 99, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='年卡'
union all
select id, null, null, 120, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='激活费'

union all
select id, 'member', 'single', 20, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单次课程'
union all
select id, 'non_member', 'single', 35, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单次课程'
union all
select id, 'member', 'weekly_pass', 99, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单周通行'
union all
select id, 'non_member', 'weekly_pass', 150, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单周通行'
union all
select id, 'member', 'monthly_pass', 250, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='月度通行'
union all
select id, 'non_member', 'monthly_pass', 400, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='月度通行'

union all
select id, null, null, 3000, 'CAD', '{}'::jsonb, true from inserted_items where category='stored_value' and name_zh='储值卡3000'
union all
select id, null, null, 6000, 'CAD', '{}'::jsonb, true from inserted_items where category='stored_value' and name_zh='储值卡6000'
union all
select id, null, null, 9000, 'CAD', '{}'::jsonb, true from inserted_items where category='stored_value' and name_zh='储值卡9000'

union all
select id, null, null, 0, 'CAD', '{}'::jsonb, true from inserted_items where category='cycle_plan' and name_zh in ('6周计划','12周计划','24周计划')

union all
select id, null, null, 120, 'CAD', '{}'::jsonb, true from inserted_items where category='assessment' and name_zh='饮食评估和饮食计划设计'
union all
select id, null, null, 120, 'CAD', '{}'::jsonb, true from inserted_items where category='assessment' and name_zh='专业身体评估与周期计划'

union all
select id, 'member', '1v1', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all
select id, 'member', '1v2', 70, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all
select id, 'non_member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all
select id, 'non_member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'

union all
select id, 'member', '1v1', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all
select id, 'member', '1v2', 70, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all
select id, 'non_member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all
select id, 'non_member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'

union all
select id, 'member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all
select id, 'member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all
select id, 'non_member', '1v1', 130, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all
select id, 'non_member', '1v2', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'

union all
select id, 'member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all
select id, 'member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all
select id, 'non_member', '1v1', 130, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all
select id, 'non_member', '1v2', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'

union all
select id, 'member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all
select id, 'member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all
select id, 'non_member', '1v1', 130, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all
select id, 'non_member', '1v2', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'

union all
select id, 'member', '1v1', 135, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all
select id, 'member', '1v2', 95, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all
select id, 'non_member', '1v1', 150, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all
select id, 'non_member', '1v2', 110, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'

union all
select id, 'member', '1v1', 135, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后'
union all
select id, 'member', '1v2', 95, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后'
union all
select id, 'non_member', '1v1', 150, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后'
union all
select id, 'non_member', '1v2', 110, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后';

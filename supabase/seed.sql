-- OXYGEN Sales Pricing - Seed Data

-- Membership
INSERT INTO public.pricing_items (category, name_zh, name_en, session_mode, price, meta, sort_order) VALUES
('membership', '日卡', 'Day Pass', 'single', 35, '{"billing_cycle":"day"}'::jsonb, 1),
('membership', '周卡', 'Week Pass', 'weekly_pass', 99, '{"billing_cycle":"week"}'::jsonb, 2),
('membership', '月卡', 'Monthly Membership', 'monthly_pass', 175, '{"billing_cycle":"month"}'::jsonb, 3),
('membership', '年卡（按月付）', 'Annual Membership (Monthly Pay)', 'annual_pass', 99, '{"billing_cycle":"month","plan_length_months":12,"note":"年卡每个月支付99"}'::jsonb, 4),
('membership', '激活费', 'Activation Fee', NULL, 120, '{"one_time":true}'::jsonb, 5);

INSERT INTO public.pricing_benefits (item_id, benefit_type, description, value_json, sort_order)
SELECT id, 'first_month_bundle', '一次一对一专属身体评估', '{"count":1}'::jsonb, 1 FROM public.pricing_items WHERE category='membership' AND name_zh='月卡'
UNION ALL
SELECT id, 'first_month_bundle', '一份专属训练计划', '{"count":1}'::jsonb, 2 FROM public.pricing_items WHERE category='membership' AND name_zh='月卡'
UNION ALL
SELECT id, 'first_month_bundle', '一次团课体验', '{"count":1}'::jsonb, 3 FROM public.pricing_items WHERE category='membership' AND name_zh='月卡'
UNION ALL
SELECT id, 'first_month_bundle', '一次营养评估及饮食计划设计', '{"count":1}'::jsonb, 4 FROM public.pricing_items WHERE category='membership' AND name_zh='月卡';

-- Group classes
INSERT INTO public.pricing_items (category, name_zh, name_en, member_type, session_mode, price, sort_order) VALUES
('group_class', '单次课程', 'Single Class', 'member', 'single', 20, 10),
('group_class', '单周通行', 'Weekly Pass', 'member', 'weekly_pass', 99, 11),
('group_class', '月度通行', 'Monthly Pass', 'member', 'monthly_pass', 250, 12),
('group_class', '单次课程', 'Single Class', 'non_member', 'single', 35, 13),
('group_class', '单周通行', 'Weekly Pass', 'non_member', 'weekly_pass', 150, 14),
('group_class', '月度通行', 'Monthly Pass', 'non_member', 'monthly_pass', 400, 15);

-- PT pricing
INSERT INTO public.pricing_items (category, name_zh, member_type, session_mode, price, meta, sort_order) VALUES
('personal_training','基础力量训练','member','1v1',100,'{"focus":"建立力量与稳定性","target":"新手"}',20),
('personal_training','基础力量训练','member','1v2',70,'{"focus":"建立力量与稳定性","target":"新手"}',21),
('personal_training','体型重塑','member','1v1',100,'{"focus":"减脂塑形","target":"想瘦/增肌"}',22),
('personal_training','体型重塑','member','1v2',70,'{"focus":"减脂塑形","target":"想瘦/增肌"}',23),
('personal_training','拳击体能','member','1v1',115,'{"focus":"提升心肺","target":"高压力"}',24),
('personal_training','拳击体能','member','1v2',85,'{"focus":"提升心肺","target":"高压力"}',25),
('personal_training','体态矫正','member','1v1',115,'{"focus":"改善姿态","target":"圆肩等"}',26),
('personal_training','体态矫正','member','1v2',85,'{"focus":"改善姿态","target":"圆肩等"}',27),
('personal_training','功能训练','member','1v1',115,'{"focus":"提升灵活性","target":"久坐"}',28),
('personal_training','功能训练','member','1v2',85,'{"focus":"提升灵活性","target":"久坐"}',29),
('personal_training','疼痛管理','member','1v1',135,'{"focus":"缓解疼痛","target":"慢性不适"}',30),
('personal_training','疼痛管理','member','1v2',95,'{"focus":"缓解疼痛","target":"慢性不适"}',31),
('personal_training','孕期产后','member','1v1',135,'{"focus":"安全恢复","target":"孕期产后"}',32),
('personal_training','孕期产后','member','1v2',95,'{"focus":"安全恢复","target":"孕期产后"}',33),
('personal_training','基础力量训练','non_member','1v1',115,'{"focus":"建立力量与稳定性","target":"新手"}',34),
('personal_training','基础力量训练','non_member','1v2',85,'{"focus":"建立力量与稳定性","target":"新手"}',35),
('personal_training','体型重塑','non_member','1v1',115,'{"focus":"减脂塑形","target":"想瘦/增肌"}',36),
('personal_training','体型重塑','non_member','1v2',85,'{"focus":"减脂塑形","target":"想瘦/增肌"}',37),
('personal_training','拳击体能','non_member','1v1',130,'{"focus":"提升心肺","target":"高压力"}',38),
('personal_training','拳击体能','non_member','1v2',100,'{"focus":"提升心肺","target":"高压力"}',39),
('personal_training','体态矫正','non_member','1v1',130,'{"focus":"改善姿态","target":"圆肩等"}',40),
('personal_training','体态矫正','non_member','1v2',100,'{"focus":"改善姿态","target":"圆肩等"}',41),
('personal_training','功能训练','non_member','1v1',130,'{"focus":"提升灵活性","target":"久坐"}',42),
('personal_training','功能训练','non_member','1v2',100,'{"focus":"提升灵活性","target":"久坐"}',43),
('personal_training','疼痛管理','non_member','1v1',150,'{"focus":"缓解疼痛","target":"慢性不适"}',44),
('personal_training','疼痛管理','non_member','1v2',110,'{"focus":"缓解疼痛","target":"慢性不适"}',45),
('personal_training','孕期产后','non_member','1v1',150,'{"focus":"安全恢复","target":"孕期产后"}',46),
('personal_training','孕期产后','non_member','1v2',110,'{"focus":"安全恢复","target":"孕期产后"}',47);

INSERT INTO public.pricing_items (category, name_zh, name_en, member_type, price, sort_order) VALUES
('assessment', '营养评估', 'Nutrition Assessment', 'member', 120, 50),
('assessment', '专业身体评估', 'Professional Body Assessment', 'member', 120, 51);

-- Cycles
INSERT INTO public.pricing_items (category, name_zh, name_en, meta, sort_order) VALUES
('cycle_plan', '6周计划', '6-Week Program', '{"weeks":6,"sessions_per_week":"2-4","min_sessions":12}'::jsonb, 60),
('cycle_plan', '12周计划', '12-Week Program', '{"weeks":12,"sessions_per_week":"2-4","min_sessions":24}'::jsonb, 61),
('cycle_plan', '24周计划', '24-Week Program', '{"weeks":24,"sessions_per_week":"2-4","min_sessions":48}'::jsonb, 62);

INSERT INTO public.pricing_benefits (item_id, benefit_type, description, value_json, sort_order)
SELECT id, 'duration_extension', '额外赠送2周有效期', '{"weeks":2}'::jsonb, 1 FROM public.pricing_items WHERE category='cycle_plan'
UNION ALL
SELECT id, 'credit_transfer', '未完成课程可转50%抵扣', '{"credit_percent":50}'::jsonb, 2 FROM public.pricing_items WHERE category='cycle_plan'
UNION ALL
SELECT id, 'included_service', '包含评估与跟踪', '{}'::jsonb, 3 FROM public.pricing_items WHERE category='cycle_plan';

-- Stored value cards
INSERT INTO public.pricing_items (category, name_zh, name_en, price, meta, sort_order) VALUES
('stored_value', '储值卡3000', 'Stored Value 3000', 3000, '{"gift_membership":"1个月","gift_amount":300,"gift_total_value":595}'::jsonb, 70),
('stored_value', '储值卡6000', 'Stored Value 6000', 6000, '{"gift_membership":"6个月","gift_amount":600,"gift_total_value":1314}'::jsonb, 71),
('stored_value', '储值卡9000', 'Stored Value 9000', 9000, '{"gift_membership":"1年","gift_amount":1500,"gift_total_value":3161}'::jsonb, 72);

-- Rules
INSERT INTO public.pricing_rules (rule_code, trigger_type, trigger_json, result_json, priority, is_active) VALUES
('RENEW_WITHIN_30_DAYS', 'renew', '{"days_lte":30}'::jsonb, '{"credit_percent_min":20,"credit_percent_max":40,"message":"30天内续费可享20%-40%抵扣"}'::jsonb, 10, true),
('REFERRAL_REWARD_MEMBERSHIP', 'generic', '{"event":"referral_success"}'::jsonb, '{"gift_membership_months":1,"message":"推荐奖励：送1个月会员"}'::jsonb, 20, true),
('MONTHLY_TO_ANNUAL_UPGRADE', 'upgrade', '{"from":"monthly","to":"annual"}'::jsonb, '{"allow_credit":true,"message":"月卡升级年卡：可抵扣"}'::jsonb, 30, true),
('ANNUAL_FULLPAY_WAIVE_ACTIVATION', 'upgrade', '{"plan":"annual","pay_type":"full"}'::jsonb, '{"waive_activation_fee":true,"message":"年卡一次付清：免激活费"}'::jsonb, 40, true),
('STORED_VALUE_6000_BENEFITS', 'recharge', '{"amount_gte":6000,"amount_lt":9000}'::jsonb, '{"matched_plan":"储值卡6000","benefits":["赠送6个月会员","赠送金额600","赠送总价值1314"]}'::jsonb, 50, true),
('SESSIONS_12_PLAN', 'buy_sessions', '{"sessions_gte":12,"sessions_lt":24}'::jsonb, '{"matched_plan":"6周计划","conditions":["每周2-4次","最少12节"],"benefits":["额外赠送2周有效期","未完成课程可转50%抵扣","包含评估与跟踪"]}'::jsonb, 60, true)
ON CONFLICT (rule_code) DO UPDATE
SET trigger_type=EXCLUDED.trigger_type,
    trigger_json=EXCLUDED.trigger_json,
    result_json=EXCLUDED.result_json,
    priority=EXCLUDED.priority,
    is_active=EXCLUDED.is_active;

begin;
select no_plan();

select ok(not has_table_privilege('anon', 'public.testimonials', 'SELECT'), 'public cannot enumerate testimonial metadata');
select ok(has_table_privilege('anon', 'public.published_testimonials', 'SELECT'), 'public can read the published projection');
select columns_are('public', 'published_testimonials', array['id', 'customer_name', 'message', 'rating'], 'projection contains public fields only');
select ok(not has_table_privilege('anon', 'public.feedback', 'INSERT'), 'anonymous feedback insert is column scoped');
select ok(not has_column_privilege('anon', 'public.feedback', 'id', 'INSERT'), 'anonymous cannot supply feedback identity');
select ok(not has_column_privilege('anon', 'public.feedback', 'created_at', 'INSERT'), 'anonymous cannot forge submission date');
select ok(not exists (select 1 from pg_publication_tables where schemaname = 'public' and tablename = 'feedback'), 'private feedback is not in Realtime publications');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, '', now(), '{}', '{}', now(), now()
from (values
  ('17900000-0000-4000-8000-000000000001'::uuid, 'cycle17-owner@example.com'),
  ('17900000-0000-4000-8000-000000000002'::uuid, 'cycle17-admin@example.com'),
  ('17900000-0000-4000-8000-000000000003'::uuid, 'cycle17-editor@example.com'),
  ('17900000-0000-4000-8000-000000000004'::uuid, 'cycle17-inactive@example.com'),
  ('17900000-0000-4000-8000-000000000005'::uuid, 'cycle17-nonadmin@example.com')
) as users(id, email);
insert into public.admin_users (id, email, role, is_active) values
  ('17900000-0000-4000-8000-000000000001', 'cycle17-owner@example.com', 'owner', true),
  ('17900000-0000-4000-8000-000000000002', 'cycle17-admin@example.com', 'admin', true),
  ('17900000-0000-4000-8000-000000000003', 'cycle17-editor@example.com', 'editor', true),
  ('17900000-0000-4000-8000-000000000004', 'cycle17-inactive@example.com', 'admin', false);

set local role anon;
select lives_ok($$insert into public.feedback (customer_name, email, subject, rating, message)
  select 'Cycle17 Customer', 'cycle17-private@example.com', subject, 4, 'Private source message'
  from unnest(array['general_inquiry','order_issue','menu_suggestion','delivery_feedback','compliment','other']) subject$$,
  'guest can submit all six canonical subjects without reading rows back');
select throws_ok($$select * from public.feedback$$, '42501', null, 'guest cannot select or enumerate feedback');
select throws_ok($$update public.feedback set message = 'tampered'$$, '42501', null, 'guest cannot update feedback');
select throws_ok($$delete from public.feedback$$, '42501', null, 'guest cannot delete feedback');
select throws_ok($$insert into public.feedback (id,customer_name,email,subject,rating,message) values (gen_random_uuid(),'A','a@example.com','other',5,'message')$$, '42501', null, 'crafted feedback identity is rejected');
select throws_ok($$insert into public.feedback (created_at,customer_name,email,subject,rating,message) values (now(),'A','a@example.com','other',5,'message')$$, '42501', null, 'crafted feedback timestamp is rejected');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','invalid','other',5,'message')$$, '23514', null, 'invalid email rejected in database');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','arbitrary',5,'message')$$, '23514', null, 'invalid subject rejected in database');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','other',0,'message')$$, '23514', null, 'rating zero rejected');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','other',6,'message')$$, '23514', null, 'rating six rejected');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','other',5,' ')$$, '23514', null, 'blank message rejected');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','other',5,repeat('x',5001))$$, '23514', null, 'oversized message rejected');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','other',5,repeat(' ',5001)||'x')$$, '23514', null, 'padding cannot bypass message size limit');
select throws_ok($$insert into public.feedback (customer_name,email,subject,rating,message) values ('A','a@example.com','other',5,E'\n\t')$$, '23514', null, 'whitespace-only message rejected');
select throws_ok($$insert into public.testimonials(customer_name,message,rating) values ('A','B',5)$$, '42501', null, 'guest cannot create testimonial');
select throws_ok($$update public.testimonials set is_published=true$$, '42501', null, 'guest cannot publish testimonial');
select throws_ok($$delete from public.testimonials$$, '42501', null, 'guest cannot delete testimonial');
reset role;

set local request.jwt.claims = '{"sub":"17900000-0000-4000-8000-000000000005","role":"authenticated"}';
set local role authenticated;
select is((select count(*)::integer from public.feedback), 0, 'non-admin cannot read private feedback');
select is((select count(*)::integer from public.testimonials), 0, 'non-admin cannot read base testimonial metadata or drafts');
select throws_ok($$insert into public.testimonials(customer_name,message,rating) values ('A','B',5)$$, '42501', null, 'non-admin cannot create or convert');
select is((with changed as (update public.testimonials set is_published=true returning id) select count(*)::integer from changed), 0, 'non-admin update affects no rows');
select is((with changed as (delete from public.testimonials returning id) select count(*)::integer from changed), 0, 'non-admin deletion affects no rows');
reset role;

set local request.jwt.claims = '{"sub":"17900000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;
select is((select count(*)::integer from public.feedback), 0, 'inactive admin cannot read private feedback');
select throws_ok($$insert into public.testimonials(customer_name,message,rating) values ('A','B',5)$$, '42501', null, 'inactive admin cannot create or convert');
select is((with changed as (update public.testimonials set is_published=true returning id) select count(*)::integer from changed), 0, 'inactive admin cannot publish');
reset role;

set local request.jwt.claims = '{"sub":"17900000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com'), 6, 'owner reads persisted private feedback');
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com' and subject='compliment'), 1, 'subject filter');
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com' and rating=4), 6, 'rating filter');
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com' and rating=4 and subject='compliment'), 1, 'combined filters');
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com' and rating=1 and subject='compliment'), 0, 'combined filter no results');
select lives_ok($$insert into public.testimonials(id,customer_name,message,rating,source_feedback_id)
  select '17000000-0000-4000-8000-000000000001', 'Redacted name', 'Reviewed public text', rating, id
  from public.feedback where email='cycle17-private@example.com' and subject='compliment'$$, 'owner copies selected fields to a draft');
select is((select is_published from public.testimonials where id='17000000-0000-4000-8000-000000000001'), false, 'conversion does not auto-publish');
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com' and message='Private source message'), 6, 'conversion preserves private originals');
select throws_ok($$insert into public.testimonials(customer_name,message,rating,is_published,published_at) values ('A','B',5,true,now())$$, '23514', null, 'even authorized creation cannot auto-publish');
select throws_ok($$update public.testimonials set rating=9 where id='17000000-0000-4000-8000-000000000001'$$, '23514', null, 'testimonial rating is database validated');
select throws_ok($$update public.testimonials set message=' ' where id='17000000-0000-4000-8000-000000000001'$$, '23514', null, 'testimonial blank message rejected');
reset role;
set local role anon;
select is((select count(*)::integer from public.published_testimonials where id='17000000-0000-4000-8000-000000000001'), 0, 'converted draft is invisible publicly');
reset role;

set local request.jwt.claims = '{"sub":"17900000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
select lives_ok($$update public.testimonials set message='Edited public text',rating=5 where id='17000000-0000-4000-8000-000000000001'$$, 'active admin can edit');
select lives_ok($$update public.testimonials set is_published=true where id='17000000-0000-4000-8000-000000000001'$$, 'admin deliberately publishes');
select ok((select published_at is not null from public.testimonials where id='17000000-0000-4000-8000-000000000001'), 'publication timestamp is database owned');
reset role;
set local role anon;
select is((select message from public.published_testimonials where id='17000000-0000-4000-8000-000000000001'), 'Edited public text', 'only published reviewed text is public');
reset role;

set local request.jwt.claims = '{"sub":"17900000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com'), 6, 'editor retains established content access');
select lives_ok($$update public.testimonials set is_published=false where id='17000000-0000-4000-8000-000000000001'$$, 'editor can unpublish under existing role model');
select ok((select published_at is null from public.testimonials where id='17000000-0000-4000-8000-000000000001'), 'unpublishing clears publication timestamp');
reset role;
set local role anon;
select is((select count(*)::integer from public.published_testimonials where id='17000000-0000-4000-8000-000000000001'), 0, 'unpublication removes public read result');
reset role;
set local role authenticated;
select lives_ok($$delete from public.testimonials where id='17000000-0000-4000-8000-000000000001'$$, 'authorized testimonial deletion');
select is((select count(*)::integer from public.feedback where email='cycle17-private@example.com'), 6, 'testimonial deletion preserves private feedback');
select is((select count(*)::integer from public.admin_audit_log where entity_id='17000000-0000-4000-8000-000000000001' and action in ('feedback_converted_to_testimonial','testimonial_updated','testimonial_published','testimonial_unpublished','testimonial_deleted')), 5, 'trusted audit covers conversion, edit, publication, unpublication and deletion');
select throws_ok($$insert into public.admin_audit_log(action,entity_type) values('forged','testimonial')$$, '42501', null, 'browser cannot forge audit log');
reset role;
select * from finish();
rollback;

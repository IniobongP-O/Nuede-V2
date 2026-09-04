begin;
select no_plan();

select ok((select reloptions @> array['security_invoker=true','security_barrier=true'] from pg_class where oid='public.checkout_payment_options'::regclass), 'checkout view obeys caller permissions');
select ok((select reloptions @> array['security_invoker=true','security_barrier=true'] from pg_class where oid='public.published_testimonials'::regclass), 'testimonial view obeys caller permissions');
select ok(has_column_privilege('anon','public.checkout_settings','paystack_enabled','SELECT'), 'guest can read public payment flags');
select ok(not has_column_privilege('anon','public.checkout_settings','updated_by','SELECT'), 'guest cannot read settings actor');
select ok(not has_column_privilege('anon','public.testimonials','source_feedback_id','SELECT'), 'guest cannot read private feedback link');
select ok(not has_column_privilege('anon','public.testimonials','created_at','SELECT'), 'guest cannot read testimonial metadata');

set local role anon;
select lives_ok($$select * from public.checkout_payment_options$$, 'public checkout read still works');
select is((select count(*)::integer from public.published_testimonials),2,'published seed stories remain readable');
select is((select count(*)::integer from public.testimonials where is_published=false),0,'direct reads cannot recover drafts');
select throws_ok($$select * from public.testimonials$$,'42501',null,'wildcard cannot recover testimonial metadata');
select throws_ok($$select * from public.checkout_settings$$,'42501',null,'wildcard cannot recover settings metadata');
select throws_ok($$select id from public.testimonials where source_feedback_id is not null$$,'42501',null,'private fields cannot be used as a filtering side channel');
select throws_ok($$update public.checkout_payment_options set paystack_enabled=false$$,'42501',null,'view grants do not allow checkout mutation');
select throws_ok($$update public.published_testimonials set message='forged'$$,'42501',null,'view grants do not allow testimonial mutation');
reset role;

set local request.jwt.claims='{}';
set local role authenticated;
select is((select count(*)::integer from public.testimonials),0,'non-admin JWT cannot read private base table');
select is((select count(*)::integer from public.checkout_settings),0,'non-admin JWT cannot read settings metadata');
select is((select count(*)::integer from public.published_testimonials),0,'invoker view cannot bypass non-admin RLS');
reset role;
select * from finish();
rollback;

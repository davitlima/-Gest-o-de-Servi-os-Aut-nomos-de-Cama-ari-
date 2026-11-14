create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'nexlar-provider-payout-release';

select cron.schedule(
  'nexlar-provider-payout-release',
  '*/5 * * * *',
  $job$
    select net.http_get(
      url := 'https://nexlar-camacari.vercel.app/api/release-due.php',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'provider_payout_cron_secret'
          order by created_at desc
          limit 1
        )
      )
    );
  $job$
);

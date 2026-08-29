# Connect `santossokaacademy.co.ke` from Truehost through Cloudflare to Manus

## Current diagnosis

The domain is partially connected. At the time of verification, `www.santossokaacademy.co.ke` resolved through `cname.manus.space` and served the Santos Soka Academy site with HTTP 200. The apex address `santossokaacademy.co.ke` resolved to a different Cloudflare endpoint and returned a Cloudflare “DNS points to prohibited IP” page. Therefore, the failure is not the Manus website itself; it is that the root/apex hostname is still using an old or conflicting DNS record.

Manus has already accepted `www.santossokaacademy.co.ke` as an available project domain. The root domain must also be added and verified in Manus if the goal is for both `https://santossokaacademy.co.ke` and `https://www.santossokaacademy.co.ke` to work.

> Important: Do not guess the apex A-record or CNAME target. Manus must display the exact record for the root domain in the project’s Domains panel. Use that value exactly.

## How the three services fit together

| Service | What it controls | What you should do |
|---|---|---|
| Truehost | Domain registration and, depending on your nameservers, DNS authority | Keep the domain registered here. Change nameservers here only if Cloudflare is being made authoritative. |
| Cloudflare | DNS records, proxying, and optional SSL layer | Edit records here if the domain uses Cloudflare nameservers. Do not also edit a separate Truehost DNS zone and expect it to control the domain. |
| Manus | Website hosting, custom-domain association, and automatic website TLS certificate | Add both hostnames in the project Domains panel and copy the exact records Manus provides. |

## Step 1 — Add both hostnames in Manus

1. Sign in to Manus with the account that owns the Santos Soka Academy project.
2. Open the project named `Santossokaacademy.co.ke`.
3. Open the project’s website **Settings** or **Domains** panel. Do not use the general project “Add website” attachment dialog.
4. Add `www.santossokaacademy.co.ke` if it is not already listed.
5. Add the apex hostname `santossokaacademy.co.ke` separately. Enter it without `https://` and without a path.
6. Manus will show the required DNS record or records. Copy them into a note. The record type may be A or CNAME, and the exact value is provider-generated.
7. Leave the Manus Domains panel open until the DNS records have been entered and verified.

Manus documents that custom-domain setup normally requires adding or updating an A record or CNAME record at the domain registrar/DNS provider, and that Manus provisions SSL/TLS automatically after the domain is connected.[1]

## Step 2 — Identify where DNS is actually managed

There are two valid configurations. Use only one of them.

### Configuration A: Cloudflare nameservers are active

If the domain’s authoritative nameservers are Cloudflare nameservers, all website DNS records must be edited in **Cloudflare → the domain → DNS → Records**. The Truehost DNS Zone Editor will not control the live records in this configuration.

To confirm this, look in Truehost under the domain’s nameserver settings. If the nameservers look like `name.ns.cloudflare.com` and `other.ns.cloudflare.com`, use Configuration A.

### Configuration B: Truehost nameservers are active

If the nameservers are Truehost nameservers, edit the records in Truehost’s DNS Zone Editor or cPanel Zone Editor. Do not create a second Cloudflare DNS zone unless you intend to change the domain’s nameservers to Cloudflare.

Truehost’s documented cPanel workflow is **cPanel → Domains → Zone Editor → Manage**, then add or edit the required DNS record.[2]

## Step 3 — If Cloudflare is authoritative, set the nameservers correctly

Only perform this step if you want Cloudflare to manage DNS.

1. In Cloudflare, add the zone for `santossokaacademy.co.ke` using the apex domain, not the `www` hostname.
2. Cloudflare will assign two authoritative nameservers.
3. In Truehost’s domain management area, replace the current nameservers with the two Cloudflare nameservers shown for this zone.
4. If DNSSEC is enabled at Truehost, disable it before changing nameservers, then re-enable DNSSEC later from Cloudflare after the zone is stable. Cloudflare warns that changing nameservers while DNSSEC is active can make the domain unreachable.[3]
5. Wait for the nameserver delegation to propagate. Do not continue changing records in Truehost after Cloudflare becomes authoritative.

Cloudflare’s full-setup documentation states that the assigned Cloudflare nameservers are displayed in the zone Overview page and that the nameservers are changed at the domain reseller/registrar.[3]

## Step 4 — Enter the Manus records in the authoritative DNS panel

In the authoritative DNS panel, create or update the records shown by Manus.

### Required `www` record

The current working record is:

| Type | Name/Host | Target/Content | Proxy setting |
|---|---|---|---|
| CNAME | `www` | `cname.manus.space` | Use the setting recommended by Manus; if Manus says DNS-only for verification, use DNS-only. |

Do not create another `www` A, AAAA, or CNAME record. Multiple conflicting records can cause intermittent results.

### Required apex/root record

For the root domain, use the exact record Manus displays:

| Type | Name/Host | Target/Content | Proxy setting |
|---|---|---|---|
| As shown by Manus | `@` or blank/root, depending on the panel | Exact value shown by Manus | Exact setting shown by Manus |

On Cloudflare, the root hostname is normally represented by `@` or the full domain. On Truehost/cPanel, it may be represented by `@`, the full domain, or a blank host field. Follow the panel’s own format.

Before saving the apex record, remove conflicting old A and AAAA records for the root hostname, especially records pointing to Cloudflare parking, an old host, or an old server. Do not remove MX, SPF, DKIM, or other mail records unless they are specifically identified as conflicting website records. This preserves email service.

Cloudflare explains that the zone apex record type and content depend on the provider hosting the website, and that `www` usually points to the same content or a redirect.[3]

## Step 5 — Cloudflare proxy and SSL settings

If Manus instructs Cloudflare to use DNS-only for a verification CNAME, set the relevant record to the gray-cloud **DNS only** mode until Manus verifies it. Cloudflare specifically recommends DNS-only for CNAME records used to verify a domain with a third-party service.[3]

If Manus confirms that the domain is connected and its certificate is active, HTTPS should be handled automatically by Manus. If Cloudflare is proxying traffic, set **SSL/TLS → Overview** to **Full (strict)** only when the Manus origin certificate is valid. Do not use Flexible mode for a production site unless the provider explicitly requires it; mismatched SSL modes can produce redirect loops or 5xx errors.

Do not add Cloudflare Workers, Redirect Rules, Page Rules, or a second origin until the basic Manus hostname works. First make the DNS path direct and unambiguous.

## Step 6 — Verify the records and website

After saving the records, wait several minutes and then check from a terminal or DNS-checking service. Replace no values in these commands.

```bash
getent hosts santossokaacademy.co.ke
getent hosts www.santossokaacademy.co.ke
curl -I -L --max-time 20 https://santossokaacademy.co.ke/
curl -I -L --max-time 20 https://www.santossokaacademy.co.ke/
```

A successful result should show both hostnames resolving to the Manus/Cloudflare delivery path and both HTTPS requests returning the Santos Soka Academy site rather than a Cloudflare parking, prohibited-IP, or old-hosting page. Check the page title as an additional identity test:

```bash
curl -L --max-time 20 -sS https://santossokaacademy.co.ke/ | grep -Eio '<title[^>]*>[^<]+' | head -n 1
curl -L --max-time 20 -sS https://www.santossokaacademy.co.ke/ | grep -Eio '<title[^>]*>[^<]+' | head -n 1
```

Then return to Manus Domains and select **Verify**, **Refresh**, or the equivalent action. Finally test these four URLs in a private/incognito window:

1. `https://santossokaacademy.co.ke/`
2. `https://www.santossokaacademy.co.ke/`
3. `https://santossokaacademy.co.ke/contact.html`
4. `https://www.santossokaacademy.co.ke/contact.html`

The Contact page should show the academy phone number and WhatsApp action, and the browser address bar should show a valid HTTPS connection.

## Exact fix for the currently observed failure

Because `www.santossokaacademy.co.ke` already reaches Manus, leave its working CNAME in place. The immediate fix is:

1. Add the root domain `santossokaacademy.co.ke` in Manus Domains.
2. Copy the exact apex DNS record Manus provides.
3. Enter that record in Cloudflare if Cloudflare nameservers are active; otherwise enter it in Truehost DNS.
4. Remove only the old conflicting root A/AAAA records that currently produce the Cloudflare “DNS points to prohibited IP” page.
5. Wait for DNS and TLS propagation, then use Manus’s verification control.

Do not point the root domain at the current `104.18.26.246` address observed during diagnosis. That address is serving the old Cloudflare error and is not a valid Manus origin record.

## Common mistakes

| Symptom | Likely cause | Correction |
|---|---|---|
| `www` works but the bare domain fails | Apex record is missing or still points to old hosting | Add the apex in Manus and replace the conflicting root record in the authoritative DNS panel. |
| Cloudflare changes have no effect | Truehost nameservers are still authoritative | Either edit Truehost DNS or switch nameservers to Cloudflare. |
| Truehost changes have no effect | Cloudflare nameservers are authoritative | Edit Cloudflare DNS instead of Truehost Zone Editor. |
| Manus says DNS not verified | Record value, host, or proxy mode is wrong | Copy the record exactly from Manus; use DNS-only when Manus requests it. |
| HTTPS certificate warning | DNS has only partially propagated or the domain is not verified | Wait for propagation, remove conflicts, and refresh Manus verification. |
| Email stops working after DNS cleanup | MX/TXT records were deleted | Restore the mail records and only change the website A/CNAME records. |
| Redirect loop through Cloudflare | Incorrect SSL mode or competing redirect rule | Remove extra redirect rules and use the SSL mode appropriate for a valid Manus origin. |

## References

[1]: https://manus.im/docs/website-builder/custom-domains "Manus — Custom Domains"

[2]: https://truehost.com/support/knowledge-base/manage-and-reset-dns-records-using-zone-editor-in-cpanel/ "Truehost — Manage and reset DNS records using Zone Editor in cPanel"

[3]: https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/ "Cloudflare — Set up a primary zone (Full setup)"

[4]: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/ "Cloudflare — Manage DNS records"

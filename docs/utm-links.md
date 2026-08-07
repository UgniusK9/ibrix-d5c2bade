# Tagged links (UTM)

The **Šaltiniai** tab in the admin reads campaign tags off each order. Those
tags only exist if the link the visitor clicked carried them. An untagged link
produces a sale filed under "direct / nežinoma" — indistinguishable from
someone who typed the address in.

So: **never post a bare `https://ibrix.lt` link again.** Tag every one.

## The four parameters

| Parameter | What it answers | Values to use |
|---|---|---|
| `utm_source` | which platform | `tiktok`, `facebook`, `instagram`, `newsletter` |
| `utm_medium` | what kind of placement | `bio`, `social`, `story`, `cpc`, `email` |
| `utm_campaign` | which push | `w16-launch`, `kaledos-2026`, `evergreen` |
| `utm_content` | **which specific video or post** | `video-042`, `post-hero`, `story-a` |

`utm_content` is the one that earns its keep. Source tells you TikTok works;
`utm_content` tells you *which video* works, which is the decision you actually
make each week.

Keep values lowercase with hyphens. `TikTok`, `tiktok` and `Tik Tok` become
three separate rows in the report.

## Ready to use

**TikTok bio** — set once, leave it:

```
https://ibrix.lt/?utm_source=tiktok&utm_medium=bio&utm_campaign=evergreen
```

**A specific TikTok video** — change `utm_content` per video:

```
https://ibrix.lt/produktai/visi?utm_source=tiktok&utm_medium=social&utm_campaign=evergreen&utm_content=video-042
```

**Facebook post:**

```
https://ibrix.lt/produktai/visi?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=post-w16
```

**Paid Meta ad** — Meta fills `{{ad.id}}` in automatically, so one link works
across the whole ad set:

```
https://ibrix.lt/?utm_source=facebook&utm_medium=cpc&utm_campaign=w16-launch&utm_content={{ad.id}}
```

Put that in the ad's **URL parameters** field, not the destination URL.

**Linking a single product** — tag the product URL directly:

```
https://ibrix.lt/produktas/10168-motorised-hypercar-w16-engine?utm_source=tiktok&utm_medium=social&utm_campaign=evergreen&utm_content=video-042
```

## How it behaves

- Tags are captured on landing and held for the whole visit, so the visitor can
  browse freely and still be attributed at checkout.
- They are stored **only after analytics consent**. Before that they are held
  in memory and written the moment consent is given. Visitors who decline show
  up as unattributed — that is deliberate and required under GDPR.
- If someone clicks a Meta ad without a tagged link, `fbclid` in the URL still
  identifies it as Facebook. The report falls back to that.
- Attribution is **last-touch**: a newly tagged visit overwrites the previous
  one.

## Checking it works

Open a tagged link, accept cookies, then in the browser console:

```js
JSON.parse(localStorage.getItem('ibrix_utm_params'))
```

You should see your values. After a test order, the same values appear on the
order row and in the **Šaltiniai** tab.

If the report says a large share of orders have no source, the usual cause is
untagged links — not a bug.

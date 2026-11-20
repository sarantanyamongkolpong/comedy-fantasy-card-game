# Sport Complex — Motorcycle Racing Research / Mira Handoff

Date: 2026-11-20 | Status: RESEARCH_VERIFIED / GAME_DESIGN_PROPOSED. **Nothing is Owner-LOCKED.** Primary sources only: MotoGP, FIM, manufacturers.

## Evidence / verified real-world facts

- Official 2026 MotoGP team roster lists **11 two-rider teams** (22 riders). Factory and independent teams, five manufacturers: Ducati, Aprilia, KTM, Yamaha, Honda. Source: https://www.motogp.com/en/teams ; riders: https://www.motogp.com/en/riders/
- Qualifying Q1/Q2 determines the **same** grid for Saturday Sprint and Sunday GP. Sprint ~half distance; Sprint first place 12 points, GP first 25. Sprint result does not change Sunday grid. Sources: https://www.motogp.com/en/news/2025/03/11/what-are-the-motogp-rules-a-complete-overview/521386 and https://www.motogp.com/en/news/2025/11/03/what-is-a-motogp-sprint-race/762769
- Michelin tyres: soft higher early grip/faster wear; hard lower initial grip but durability; medium balance; wet tyres distinct. Choice depends on circuit surface/temperature, weather, riding style/setup and race length. Exact tyre allocations can change with FIM regulations, so store as configurable event data. Sources: https://www.motogp.com/en/news/2025/04/30/how-does-motogp-tyre-selection-work-the-ultimate-guide/747424 ; https://www.fim-moto.com/en/documents/view/fim-2026-motogp-moto2-moto3-world-championship-regulations-update-13-september
- Teams tune suspension, wheelbase/geometry, gearing, electronics, brakes and tyres for each circuit. Shorter wheelbase aids tight-corner agility, longer one high-speed stability. Source: https://www.motogp.com/en/news/2025/05/07/how-do-motogp-teams-prepare-bikes-for-different-tracks/748304
- **Real MotoGP riders each have TWO physical bikes** available to swap in declared flag-to-flag wet conditions. Game's requested **2 riders + 2 bikes per team** means ONE assigned bike per rider, a distinct design abstraction. Source: https://www.motogp.com/en/news/2025/01/31/how-do-motogp-riders-switch-bikes-during-a-racex/517529
- Official 2026 bike families: Ducati Desmosedici GP26, Aprilia RS-GP26, KTM RC16, Honda RC213V and Yamaha YZR-M1. **Yamaha changed to V4 for 2026**, unlike old inline-four references. Sources: https://www.ducati.com/us/en/racing/motogp/ducati-lenovo-team-bike-desmosedici-gp ; https://www.aprilia.com/us_EN/aprilia-racing/moto-gp/the-bike/ ; https://press.ktm.com/news-race-ready-2026-motogp-gets-live?id=229400&imageid=920294&l=international&menueid=7311 ; https://motogp.honda.racing/page/rc213v-b5943814 ; https://www.yamaha-racing.com/series/grand-prix/motogp/bike/

## Proposed fictional manufacturers / bikes (NOT real performance ratings)

| Original constructor | Original fictional bike | Research inspiration | Draft game profile |
|---|---|---|---|
| Red Quack Works | RubberDuck V-Quack | Ducati GP26 | acceleration-high, top-speed-high, handling-medium |
| Purple Petal Moto | Petal-26 | Aprilia RS-GP26 | handling-high, acceleration-medium, top-speed-medium |
| Orange Anvil Motors | Hammer Sixteen | KTM RC16 | acceleration-high, handling-medium, top-speed-medium |
| Blue Melody Works | Echo V4 | 2026 Yamaha YZR-M1 V4 | handling-high, acceleration-medium, top-speed-medium |
| Sakura Forge | Phoenix 213 | Honda RC213V | handling-medium, acceleration-medium, top-speed-medium |

The above relative traits are *fictional balance suggestions*. No primary source offers comparable official H/M/L acceleration or handling ratings for these bikes.

## Proposed parody rider roster (traits all invented for gameplay)

| Fictional rider | Official profile inspiration | Handling | Speed-use | Accel-use | Fictional specialty |
|---|---|---|---|---|---|
| Mako Mayhem | Marc Marquez — https://www.motogp.com/en/riders/marc-marquez/23e50438-a657-4fb0-a190-3262b5472f29 | H | M | M | comeback/overtake risk |
| Paco Bagnetti | Francesco Bagnaia — https://www.motogp.com/en/riders/francesco-bagnaia/66b78301-5826-4986-b11e-fa68a7bd77a7 | M | H | M | smooth consistency |
| Fabio Fourturn | Fabio Quartararo — https://www.motogp.com/en/riders/fabio-quartararo/bf95d959-6a60-44f1-84b5-ded861e62578 | H | M | H | qualifying burst |
| Pedro Acoaster | Pedro Acosta — https://www.motogp.com/en/riders/pedro-acosta/ea39a0af-95d3-4a37-81a7-f332efdb9216 | H | M | H | late braking / risk |
| Jorge Martian | Jorge Martin — https://www.motogp.com/en/riders/jorge-martin/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc | M | H | H | sprint start |
| Brady Blender | Brad Binder — https://www.motogp.com/en/riders/brad-binder/ade5ef32-01ea-487c-95ca-491544a668ed | M | M | H | overtaking resilience |
| Marco Buzzachi | Marco Bezzecchi — https://www.motogp.com/en/riders/marco-bezzecchi/e622ec5b-5ccf-457c-a67f-ec028f0ddf6e | H | M | M | technical-corner rhythm |
| Joan Mirage | Joan Mir — https://www.motogp.com/en/riders/joan-mir/f55f9c34-8621-437b-ae04-ae2418720204 | M | M | M | low error rate |
| Torak Razzle | Toprak Razgatlioglu — https://www.motogp.com/en/riders/toprak-razgatlioglu/c883a3b8-17ce-419d-b71b-32c252f6fc7e | H | M | H | braking wildcard |
| Ayo Oguramen | Ai Ogura — https://www.motogp.com/en/riders/ai-ogura/244b6f51-ac33-40ee-876d-9401dc9d1346 | H | M | M | smooth line choice |

H/M are **qualitative proposed fictional values, not claims about real riders**. Bike top speed should be the major top-speed source; rider 'speed-use' represents tuck/exits/efficiency. Do not depict physical likeness, real helmets or sponsor liveries.

## Proposed original tracks, based on documented circuit *types* (not traced layouts)

| Parody track | Official reference | Race characteristics / preferred build |
|---|---|---|
| Mushgello Valley | Mugello: https://www.motogp.com/en/calendar/2026/event/italy/bf2104f9-f5cc-4a99-a993-cb5d01bccd24 | long straight, flowing corners; speed and stability |
| Sausage Ring | Sachsenring: https://www.motogp.com/en/calendar/2026/event/germany/259be6f4-c23c-4dc2-bc42-7664842f6409 | tight and left-biased; handling, tyre side wear |
| Pillow Island | Phillip Island: https://www.motogp.com/en/calendar/2026/event/australia/66961f05-2454-4455-9d65-f99c49d25b17 | very fast and flowing; sustained pace |
| Buri-Ramen Raceway | Buriram: https://www.motogp.com/en/news/2026/02/26/enstination-thailand-burirams-beating-heart-brings-motogps-2026-opener/998050 | long straights + flowing finish; brake/exits |
| Assen S-Bend | Assen: https://www.motogp.com/en/calendar/2026/event/netherlands/47c25c37-d307-4d45-b1ed-b1cb5e811975 | direction changes; responsive handling |
| Corners of Chaos | Circuit of the Americas: https://www.motogp.com/en/calendar/2026/event/americas/8c83648e-8ec9-40f1-9ba0-b0f19883e7d7 | uphill start/technical bends + straight; mixed demands |

Suggested per-track data: straight_weight, corner_weight, accel_weight, braking_weight, left_turn_bias, abrasiveness, temperature, wet_chance, lap_count. All numerical weighting TBD.

## Proposed auto-sim core / two independent gachas

1. Rider Gacha and Bike Gacha are independent pools, separate configurable pity counters (do NOT infer locked rates). Pull rider or bike inventory.
2. Before race assign two DIFFERENT riders, each one different owned bike. Set front/rear dry compound Soft/Medium/Hard (or simpler one compound per bike), Rain if wet. Choose setup preset Speed, Handling, Balanced, Wet and aggression level per rider.
3. Qualifying seeded auto-lap sets grid. Sprint ~half duration and GP full duration. Team outcome = both finish positions; one DNF does not cancel teammate race.
4. Per lap sectors evaluate bike speed/accel/handling, rider corner/brake/consistency, track weights, tyre grip/wear, condition/temperature, fatigue and seeded incidents. Show lap log and optional fast-forward. All formula coefficients editable.
5. Rider stamina (e.g. max 100) is **game design only**, not an official MotoGP number. Race length/heat/aggressive strategy depletes it, rest/Hideout recovers it. Fatigue worsens late pace/mistake probability. Exact depletion/recovery remains owner PROPOSED.
6. Never assume team 2-bikes permits real flag-to-flag swaps: each rider would require a spare if that future mode is implemented.

## IP / status caveats

MotoGP brand/team marks, manufacturers, sponsors, rider likenesses and exact circuits can be licensed/protected. Parody name alone is no blanket commercial licence. Use distinctive fictional trademarks, helmet designs, suit colors, faces, original track geometry; seek licensing/legal review for realistic branded use. Research shows *inspiration*, not official performance ratings. No code, PR or balance data altered.

# ChargeWise — Intelligent EV Charging Planner

**Power your journey. Master your energy.**

ChargeWise ranks the charging stations you can actually reach with your connectors and battery reserve, plans multi-stop journeys, forecasts network demand, and lets you test network changes in Sandbox Mode — all in a retro-arcade interface with light and dark themes.

## Features

- **Charging Stations** — connector-aware, reserve-safe ranking with transparent scoring and explanations, on a Leaflet + OpenStreetMap map.
- **Route Planner** — charging-stop plan to your destination; feasible plans can be locked in for XP and journey history.
- **Mission Control** — modelled utilisation and waits by hour, load balance and network insights.
- **Sandbox Mode** — add/remove charging points or change prices and compare before vs after.
- **Accounts** (Supabase) — sign-up, login, password reset, EV garage, preferences, saved stations and journey history.

## Data accuracy

Station locations, connector prices, plug availability, demand and waiting times come from a **simulated Delhi NCR network model**. Distances are straight-line estimates multiplied by a road factor; no road routing is used. The interface labels these values as simulated wherever they appear.

## Setup

Accounts require a Supabase project — see [`docs/supabase-setup.md`](docs/supabase-setup.md). Planning, forecasting and Sandbox Mode work without an account.

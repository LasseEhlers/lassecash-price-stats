# LasseCash-price-stats

Sovereign, zero-fee market statistics and historical price dashboard for LasseCash. This dashboard tracks immutable historical trading data from Hive Engine (2019 inception to present) and includes native architectural support for upcoming MAGI network migration swap metrics.

## Overview
This repository provides a clean, single-file frontend for monitoring the LasseCash ecosystem. It acts as the bridge between legacy Hive Engine market data and the future of the MAGI-native sovereign economy.

## Features
*   **Historical Accuracy:** Real-time data fetching from the Hive Engine API for LASSECASH market metrics.
*   **Migration-Ready:** Built-in toggle to switch context between legacy Hive Engine metrics and post-migration MAGI swap data.
*   **Sovereign Aesthetic:** Dark-mode, minimalist design built with Tailwind CSS.
*   **Performance:** Lightweight and dependency-free (via CDNs), allowing for instant deployment or local hosting.
*   **No Fees:** Reflects the LasseCash ethos—simple, transparent, and direct market data visualization.

## Architecture
*   **Frontend:** HTML5 + Tailwind CSS
*   **Data Visualization:** Chart.js
*   **Data Sources:** 
    *   Legacy: Hive Engine RPC API (`api.hive-engine.com`)
    *   Future/Migration: Direct integration hooks for the MAGI network state.

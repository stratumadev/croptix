class Empty {
  toDestroy = [];

  get attributes() {
    return [];
  }

  destroy() {
    this.toDestroy.forEach((toDestroy) => toDestroy());
  }

  onDestroy(callback) {
    this.toDestroy.push(callback);
  }
}

class Series extends Empty {
  constructor() {
    super();
    const [seriesId] = location.pathname.match(/(?<=\/series\/)[^\/]*/) || [];
    if (!seriesId) return;
    const seasons = API.seasons(seriesId);
    const episodes = this.#getEpisodesProxy();
    this.markAsWatchedNotWatched = new MarkAsWatchedNotWatched(seriesId, seasons, episodes);
  }

  #getEpisodesProxy() {
    return new Proxy(
      {},
      {
        get(target, p) {
          if (!(p in target)) {
            target[p] = API.episodes(p);
          }
          return Reflect.get(target, p);
        },
      },
    );
  }

  destroy() {
    super.destroy();
    this.markAsWatchedNotWatched?.destroy();
  }
}

class MarkAsWatchedNotWatched {
  static REFRESH_TIMEOUT = 2500;

  seriesId;
  refreshTimeout;

  constructor(seriesId, seasons, episodes) {
    this.refresh = this.refresh.bind(this);
    this.seriesId = seriesId;
    this.seasons = seasons;
    this.episodes = episodes;

    const appBodyWrapper = document.querySelector('.erc-root-layout');
    if (!appBodyWrapper) return;
    const ercSeasonWithNavigation = appBodyWrapper.querySelector('.erc-season-with-navigation');
    if (ercSeasonWithNavigation) {
      this.createAndWatch(ercSeasonWithNavigation);
    } else {
      new MutationObserver((_, observer) => {
        const ercSeasonWithNavigation = appBodyWrapper.querySelector('.erc-season-with-navigation');
        if (!ercSeasonWithNavigation) return;
        observer.disconnect();
        this.createAndWatch(ercSeasonWithNavigation);
      }).observe(appBodyWrapper, {
        childList: true,
        subtree: true,
      });
    }
  }

  get upNextSeries() {
    Object.defineProperty(this, 'upNextSeries', {
      value: API.up_next_series(this.seriesId),
    });
    return this.upNextSeries;
  }

  destroy() {
    clearInterval(this.refreshTimeout);
  }

  createAndWatch(ercSeasonWithNavigation) {
    this.getCurrentSeasonEpisodes().then((episodes) => {
      ercSeasonWithNavigation.querySelectorAll('.card').forEach((card) => {
        this.card(card, episodes);
      });
      this.watchCollection(ercSeasonWithNavigation);
    });
    this.watchSeason(ercSeasonWithNavigation);
  }

  watchSeason(ercSeasonWithNavigation) {
    new MutationObserver((mutations) => {
      const ercSeasonEpisodeList = mutations.reduce(
        (f, { addedNodes }) =>
          f || [...addedNodes].find(({ classList }) => classList.contains('erc-season-episode-list')),
        false,
      );
      if (!ercSeasonEpisodeList) return;
      this.getCurrentSeasonEpisodes().then((episodes) => {
        ercSeasonEpisodeList.querySelectorAll('.card').forEach((card) => {
          this.card(card, episodes);
        });
        this.watchCollection(ercSeasonWithNavigation);
      });
    }).observe(ercSeasonWithNavigation, {
      childList: true,
    });
  }

  watchCollection(ercSeasonWithNavigation) {
    const ercPlayableCollection = ercSeasonWithNavigation.querySelector('.erc-playable-collection');
    if (!ercPlayableCollection) return;
    new MutationObserver((mutations) => {
      const cards = [...mutations]
        .flatMap(({ addedNodes }) => [...addedNodes])
        .filter(({ classList }) => classList.contains('card'));
      if (cards.length > 0) {
        this.getCurrentSeasonEpisodes().then((episodes) => {
          cards.forEach((card) => this.card(card, episodes));
        });
      }
    }).observe(ercPlayableCollection, {
      childList: true,
    });
  }

  getCurrentSeasonEpisodes() {
    const currentSeasonTitle = document.querySelector('.seasons-select h4, .seasons-select span[class^=select-trigger__title]');
    
    if (!currentSeasonTitle) {
      return this.upNextSeries.then(({ season_id }) => {
        return this.episodes[season_id];
      });
    }

    const UI_Title = currentSeasonTitle.innerText.toLowerCase().trim();

    return this.seasons.then((seasons) => {
      // 1. Cerca prima una corrispondenza ESATTA
      let found = seasons.find(({ title }) => title.toLowerCase().trim() === UI_Title);

      // 2. Se non la trova, cerca la corrispondenza più lunga (es: "OVA Season 1" vince su "Season 1")
      if (!found) {
        const sortedSeasons = [...seasons].sort((a, b) => b.title.length - a.title.length);
        found = sortedSeasons.find(({ title }) => {
          const apiTitle = title.toLowerCase().trim();
          return UI_Title.includes(apiTitle) || apiTitle.includes(UI_Title);
        });
      }

      if (found) {
        return this.episodes[found.id];
      }
      return [];
    });
  }

  card(card, episodes) {
    new MutationObserver((mutations) => {
      if (
        mutations
          .flatMap((mutation) => [...mutation.addedNodes])
          .some((node) => [...node.classList].find((c) => c.startsWith('playable-card')))
      ) {
        this.getCurrentSeasonEpisodes().then((episodes) => {
          this.createCard(card, episodes);
        });
      }
    }).observe(card, {
      childList: true,
    });
    this.createCard(card, episodes);
  }

  createCard(card, episodes) {
    const body = card.querySelector(`[class^='playable-card__body']`);
    if (!body || body.querySelector('.ic_action')) return;
    const a = card.querySelector('a');
    if (!a) return;
    const episode = episodes.find(({ id, versions }) => {
      const hasVersions = versions && Array.isArray(versions) && versions.some(({ guid }) => a.href.includes(guid));
      return a.href.includes(id) || hasVersions;
    });
    if (!episode) return;

    const release = card.querySelector(`[class^='playable-card-hover__release']`);
    const footer = card.querySelector('[class^="playable-card__footer"]');

    if (release) {
      release.querySelector('span').textContent += ` - ${new Date(episode.availability_starts).toLocaleTimeString()}`;
    }

    const actionMenuRenderer = new ActionMenuRenderer(this.createMarkAsWatchedNotWatchedEntries(episode, episodes));
    if (actionMenuRenderer.length === 0) {
      return;
    }
    const actionMenu = actionMenuRenderer.render();

    footer.classList.add('ic_action');

    const optionsButton = footer.querySelector('[class^="dropdown-trigger"]');
    
	  optionsButton.addEventListener('click', (e) => {
      // Impedisce la chiusura immediata dovuta al click sul pulsante stesso
      e.stopPropagation();

      const parent = optionsButton.parentElement;
      const isAlreadyOpen = parent.querySelector('.custom-action-menu');

      // Helper: chiude tutti i menu aperti e riporta le card al loro z-index normale
      const closeAllMenus = () => {
        document.querySelectorAll('.custom-action-menu').forEach(menu => menu.remove());
        document.querySelectorAll('.card.ic_menu_open').forEach(c => c.classList.remove('ic_menu_open'));
      };

      // 1. Chiudi TUTTI i menu aperti in altre card prima di fare altro
      closeAllMenus();

      // 2. Se quello su cui abbiamo cliccato NON era aperto, lo apriamo
      if (!isAlreadyOpen) {
        setTimeout(() => {
          actionMenu.setStyle('margin-top', '24px');
          actionMenu.setStyle('right', '0');
          
          // Aggiungiamo una classe specifica per poterlo trovare e rimuovere
          const menuElement = actionMenu.getElement();
          menuElement.classList.add('custom-action-menu');

          if (window.innerWidth - optionsButton.getBoundingClientRect().right < 300) {
            actionMenu.addClass('left');
          }

          // Porta in primo piano la card che contiene il menu, altrimenti il menu
          // finisce dietro al riquadro dell'episodio sottostante e non e' cliccabile
          const cardEl = optionsButton.closest('.card');
          if (cardEl) cardEl.classList.add('ic_menu_open');

          parent.appendChild(menuElement);

          // 3. Listener globale: se clicchi ovunque fuori, chiudi il menu
          const closeAll = () => {
            closeAllMenus();
            document.removeEventListener('click', closeAll);
          };
          document.addEventListener('click', closeAll);
        }, 0);
      }
    });
  }

  createMarkAsWatchedNotWatchedEntries(episode, episodes) {
    const { id, sequence_number: episode_sequence_number, duration_ms } = episode;
    const {
      0: { sequence_number: first_episode_sequence_number },
      length,
      [length - 1]: { sequence_number: last_episode_sequence_number },
    } = episodes;
    return [
      {
        name: 'markAsWatched',
        type: 'menu',
        subMenus: [
          {
            name: 'markOnlyThisOne',
            type: 'action',
            action: () => API.markAsWatched(id).then(this.refresh), // MODIFICATO: usa markAsWatched
          },
          {
            name: 'markAllPrevious',
            if: () => episode_sequence_number > first_episode_sequence_number,
            type: 'action',
            action: () =>
              API.markAsWatched(
                episodes
                  .filter(({ sequence_number }) => sequence_number <= episode_sequence_number)
                  .map(({ id }) => id) // MODIFICATO: usa markAsWatched con array di ID
              ).then(this.refresh),
          },
        ],
      },
      {
        name: 'markAsNotWatched',
        type: 'menu',
        subMenus: [
          {
            name: 'markOnlyThisOne',
            type: 'action',
            action: () => API.deleteFromHistory(id).then(this.refresh(false)), // MODIFICATO: usa deleteFromHistory
          },
          {
            name: 'markAllNext',
            if: () => last_episode_sequence_number !== episode_sequence_number,
            type: 'action',
            action: () =>
              API.deleteFromHistory(
                episodes
                  .filter(({ sequence_number }) => sequence_number >= episode_sequence_number)
                  .map(({ id }) => id)
              ).then(this.refresh(false)), // MODIFICATO: usa deleteFromHistory con array di ID
          },
        ],
      },
    ];
  }

  refresh(dft = true) {
    clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(() => {
      const searchA = document.querySelector('a[href$="/search"]');
      if (dft && searchA) {
        searchA.click();
        history.back();
      } else {
        location.reload();
      }
    }, MarkAsWatchedNotWatched.REFRESH_TIMEOUT);
  }
}
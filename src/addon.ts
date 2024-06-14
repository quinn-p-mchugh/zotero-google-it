import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
import { config } from "../package.json";

class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    prefs?: {
      window: Window;
      columns: Array<ColumnOptions>;
      rows: Array<{ [dataKey: string]: string }>;
    };
    dialog?: DialogHelper;
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: object;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit: createZToolkit(),
    };
    this.hooks = hooks;
    this.api = {};

    this.initializeCollectionMenuItem();
    this.initializeItemMenuItem();
  }

  private initializeCollectionMenuItem() {
    const { ztoolkit } = this.data;

    ztoolkit.Menu.register("collection", {
      tag: "menuitem",
      id: "zgi-good-search-collection-command",
      label: "Google It - Launch Google search from collection URLs",
      icon: `chrome://${config.addonRef}/content/icons/google-icon.png`,
      commandListener: async () => {
        const selectedCollection = ZoteroPane.getSelectedCollection()
          ? ZoteroPane.getSelectedCollection()
          : ZoteroPane.getSelectedSavedSearch();
        //Zotero.debug(selectedCollection.name);
        if (selectedCollection) {
          const items = await selectedCollection.getChildItems();
          const urls = items
            .map((item) => item.getField("url"))
            .filter((url) => url);

          if (urls.length) {
            const googleSearchQuery = this.buildGoogleSearchQuery(urls);
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}&focus=searchbar`;
            Zotero.launchURL(googleSearchUrl);
          } else {
            Zotero.alert(
              null,
              "No URLs found",
              "No URLs found in the selected collection.",
            );
          }
        } else {
          Zotero.alert(
            null,
            "No collection selected",
            "Please select a collection to perform a Google search.",
          );
        }
      },
    });
  }

  private initializeItemMenuItem() {
    const { ztoolkit } = this.data;

    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zgi-good-search-item-command",
      label: "Google It - Launch Google search from item URLs",
      icon: `chrome://${config.addonRef}/content/icons/google-icon.png`,
      commandListener: async () => {
        const selectedItems = ZoteroPane.getSelectedItems();
        if (selectedItems) {
          const urls = selectedItems
            .map((item) => item.getField("url"))
            .filter((url) => url);

          if (urls.length) {
            const googleSearchQuery = this.buildGoogleSearchQuery(urls);
            const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}&focus=searchbar`;
            Zotero.launchURL(googleSearchUrl);
          } else {
            Zotero.alert(
              null,
              "No URLs found",
              "No URLs found in the selected items.",
            );
          }
        } else {
          Zotero.alert(
            null,
            "No item(s) selected",
            "Please select one or more items to perform a Google search.",
          );
        }
      },
    });
  }

  /**
   * Clean the URL by stripping "http://", "https://", or "www.".
   * @param url URL to clean.
   * @returns Cleaned URL.
   */
  private cleanUrl(url: string): string {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "");
  }

  /**
   * Construct a Google search query from the provided URLs.
   * @param urls Array of URLs to search.
   * @returns Google search query string.
   */
  private buildGoogleSearchQuery(urls: string[]): string {
    return urls.map((url) => `site:${this.cleanUrl(url)}`).join(" | ");
  }
}

export default Addon;

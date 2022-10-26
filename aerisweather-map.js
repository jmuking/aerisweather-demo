const template = document.createElement("template");
template.innerHTML = `
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.2/dist/leaflet.css"
    integrity="sha256-sA+zWATbFveLLNqWO2gtiw3HL/lh1giY/Inf1BJ0z14="
    crossorigin=""
  />

  <style>
    .leaflet-container {
      height: 100vh;
    }
  </style>

  <svg
    id="storm-report-svg"
    style="width: 24px; height: 24px"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M6,16A5,5 0 0,1 1,11A5,5 0 0,1 6,6C7,3.65 9.3,2 12,2C15.43,2 18.24,4.66 18.5,8.03L19,8A4,4 0 0,1 23,12A4,4 0 0,1 19,16H18A1,1 0 0,1 17,15A1,1 0 0,1 18,14H19A2,2 0 0,0 21,12A2,2 0 0,0 19,10H17V9A5,5 0 0,0 12,4C9.5,4 7.45,5.82 7.06,8.19C6.73,8.07 6.37,8 6,8A3,3 0 0,0 3,11A3,3 0 0,0 6,14H7A1,1 0 0,1 8,15A1,1 0 0,1 7,16H6M12,11H15L13,15H15L11.25,22L12,17H9.5L12,11Z"
    />
  </svg>
  <svg
    id="facility-svg"
    style="width: 24px; height: 24px"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M5,3V21H11V17.5H13V21H19V3H5M7,5H9V7H7V5M11,5H13V7H11V5M15,5H17V7H15V5M7,9H9V11H7V9M11,9H13V11H11V9M15,9H17V11H15V9M7,13H9V15H7V13M11,13H13V15H11V13M15,13H17V15H15V13M7,17H9V19H7V17M15,17H17V19H15V17Z"
    />
  </svg>
`;

const PERIOD_OPTIONS = [6, 12, 24, 48, 168];

class AerisWeatherMap extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.appendChild(template.content.cloneNode(true));

    // get root api for data
    this.apiRoot = this.parseAttribute("api_root");

    // handle authentication
    this.clientId = this.parseAttribute("client_id");
    this.clientSecret = this.parseAttribute("client_secret");

    // the radius
    this.radius = this.parseAttribute("radius");

    // the bounding area
    this.p = this.parseAttribute("p");

    // could be 6, 12, 24, 48, 168
    this.pastHours = this.parseAttribute("past_hours");
    if (!PERIOD_OPTIONS.includes(parseInt(this.pastHours))) {
      console.warning(
        "You must pick either 6, 12, 24, 48, or 168 hours for your past_hours. defaulting to 6 hours."
      );
      this.pastHours = 6;
    }

    // could be null, wind, hail, tornado, flooding
    this.filter = this.parseAttribute("filter");

    // facility geojson featuresets for visualization
    this.facilityEndpoints = this.parseAttribute("facility_endpoints");
    this.facilityEndpoints = this.facilityEndpoints.split(",");

    // storm report icon url
    this.stormReportSvg = this.parseSvg("storm-report-svg");

    // storm report icon url
    this.facilitySvg = this.parseSvg("facility-svg");

    this.limit = 500;
  }

  parseSvg(id) {
    let obj = document.getElementById(id);
    if (!obj) {
      obj = this._shadowRoot.getElementById(id);
      parent = this._shadowRoot;
    } else {
      parent = obj.parentElement;
      this._shadowRoot.removeChild(this._shadowRoot.getElementById(id));
    }

    let clonedObj = obj.cloneNode(true);
    parent.removeChild(obj);

    return clonedObj;
  }

  parseAttribute(name) {
    let obj = this.getAttribute(name);
    if (obj === "") obj = null;
    return obj;
  }

  createPopupListItem(label, value) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<b>${label}</b>: ${value}`;
    return listItem;
  }

  initLeaflet() {
    const coords = this.p
      .replace(" ", "")
      .split(",")
      .map((coord) => parseFloat(coord));

    this.map = L.map(this.mapElement).setView(coords, 6);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  async fetchStormData() {
    const payload = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      from: `-${this.pastHours}hours`,
      to: "now",
      format: "json",
      limit: this.limit,
    };

    if (this.p) payload.p = this.p;
    if (this.filter) payload.filter = this.filter;
    if (this.radius) payload.radius = this.radius;

    const data = await fetch(this.apiRoot + "?" + new URLSearchParams(payload));
    const result = await data.json();

    if (result.error) {
      console.error(result.error);
      return [];
    }

    return result.response;
  }

  async renderStormData(stormData) {
    const stormMarkers = stormData.map((result) => {
      const listElement = document.createElement("ul");

      listElement.appendChild(
        this.createPopupListItem(
          "type/cat",
          `${result.report.cat} (${result.report?.type})`
        )
      );
      listElement.appendChild(
        this.createPopupListItem("date", result.report?.datetime)
      );
      listElement.appendChild(
        this.createPopupListItem("location", result.report?.name)
      );
      if (result.report.detail?.windSpeedMPH)
        listElement.appendChild(
          this.createPopupListItem(
            "wind speed (mph)",
            result.report.detail?.windSpeedMPH
          )
        );
      listElement.appendChild(
        this.createPopupListItem("notes", result.report?.comments)
      );

      const svgIcon = L.divIcon({
        html: this.stormReportSvg.cloneNode(true),
        className: "",
        iconSize: 40,
      });

      return L.marker([result.loc.lat, result.loc.long], {
        icon: svgIcon,
      }).bindPopup(listElement);
    }, []);

    this.stormReports = L.layerGroup(stormMarkers);
    this.stormReports.addTo(this.map);
  }

  async renderFacilityData() {
    const facilityRequests = this.facilityEndpoints.map(
      async (facilityEndpoint) => {
        const data = await fetch(facilityEndpoint);
        const results = await data.json();
        const geoJSONResults = results.map((result) => {
          return {
            type: "Feature",
            properties: {
              name: result.name,
            },
            geometry: {
              type: "Point",
              coordinates: [result.lon, result.lat],
            },
          };
        });

        L.geoJSON(geoJSONResults, {
          pointToLayer: (geoJsonPoint, latlng) => {
            const svgIcon = L.divIcon({
              html: this.facilitySvg.cloneNode(true),
              className: "",
              iconSize: 40,
            });

            return L.marker(latlng, {
              icon: svgIcon,
            });
          },
        }).addTo(this.map);
      }
    );
  }

  async render() {
    if (this.mapElement) {
      this._shadowRoot.removeChild(this.mapElement);
    }

    this.mapElement = document.createElement("div");
    this._shadowRoot.appendChild(this.mapElement);
    this.initLeaflet();

    const stormData = await this.fetchStormData();
    this.renderStormData(stormData);
    this.renderFacilityData();
  }

  // Invoked when the custom element is first connected to the document's DOM.
  connectedCallback() {
    this.render();
  }

  // Invoked when the custom element is disconnected from the document's DOM.
  disconnectedCallback() {}

  // Invoked when the custom element is moved to a new document.
  adoptedCallback() {}

  // Invoked when one of the custom element's attributes is added, removed, or changed.
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }
}

window.customElements.define("aerisweather-map", AerisWeatherMap);

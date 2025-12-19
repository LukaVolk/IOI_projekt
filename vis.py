import pandas as pd
import geopandas as gpd
import seaborn as sns
import matplotlib.pyplot as plt

SLOVENIA_GEOJSON_URL = "https://raw.githubusercontent.com/jeancaffou/gurs-obcine/refs/heads/master/Obcine-epsg4326.geojson"


def load_combined_data():
    df = pd.read_csv("data/pm10_wind_combined_data.csv")
    return df


def load_cities_data():
    city_df = pd.read_csv("data/cities_data.csv")
    return city_df


def plot_pm10_concentration(df):
    # group by date and calculate mean PM10 concentration
    daily_pm10 = df.groupby("timestamp")["PM10"].mean().reset_index()

    sns.scatterplot(
        data=daily_pm10,
        x="timestamp",
        y="PM10",
    )

    plt.show()


def plot_map(df, timestamp):
    slovenia_gdf = gpd.read_file(SLOVENIA_GEOJSON_URL)
    cities_df = load_cities_data()

    filtered_data = df[df["timestamp"] == timestamp]
    cities = cities_df["city"].tolist()

    x = cities_df["longitude"]
    y = cities_df["latitude"]

    # extract pm10 values for each city in cities
    pm10 = []
    for city in cities:
        pm10_value = filtered_data[filtered_data["city"] == city]["PM10"].values
        if len(pm10_value) > 0:
            pm10.append(pm10_value[0])
        else:
            pm10.append(0)

    sizes = [value * 2 for value in pm10]

    colormap = plt.cm.plasma
    norm = plt.Normalize(vmin=min(pm10), vmax=max(pm10))
    colors = [colormap(norm(value)) for value in pm10]

    # create the color scale bar
    color_scale = plt.cm.ScalarMappable(norm=norm, cmap=colormap)

    fig, ax = plt.subplots(figsize=(10, 10))
    slovenia_gdf.plot(ax=ax, color="lightgrey", edgecolor="white")
    ax.scatter(
        x=x,
        y=y,
        s=sizes,
        color=colors,
        alpha=0.6,
    )

    # add text labels for each city
    for i, city in enumerate(cities):
        ax.text(
            x[i],
            y[i] + 0.01,
            pm10[i],
            fontsize=10,
            ha="center",
            va="bottom",
        )

    ax.figure.colorbar(color_scale, ax=ax, label="PM10 Concentration")
    ax.set_title("Map")
    plt.show()


if __name__ == "__main__":
    combined_data = load_combined_data()
    plot_map(combined_data, "2024-02-03 11:50:00")

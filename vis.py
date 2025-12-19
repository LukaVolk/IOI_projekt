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


def plot_map():
    slovenia_gdf = gpd.read_file(SLOVENIA_GEOJSON_URL)
    cities_df = load_cities_data()

    fig, ax = plt.subplots(figsize=(10, 10))
    slovenia_gdf.plot(ax=ax, color="lightgrey", edgecolor="white")
    ax.scatter(
        cities_df["longitude"],
        cities_df["latitude"],
        s=50,
        color="red",
        alpha=0.6,
    )
    ax.set_title("Map")
    plt.show()


if __name__ == "__main__":
    plot_map()

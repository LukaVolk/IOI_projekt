import pandas as pd
import geopandas as gpd
import seaborn as sns
import matplotlib.pyplot as plt


def load_df():
    df = pd.read_csv("data/pm10_wind_combined_data.csv")
    return df


def plot_pm10_concentration(df):
    # group by date and calculate mean PM10 concentration
    daily_pm10 = df.groupby("timestamp")["PM10"].mean().reset_index()

    sns.scatterplot(
        data=daily_pm10,
        x="timestamp",
        y="PM10",
    )

    plt.show()


if __name__ == "__main__":
    df = load_df()
    plot_pm10_concentration(df)

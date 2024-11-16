from pymongo import MongoClient
import pandas as pd
from bson import ObjectId
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask,jsonify,request

app = Flask(__name__)

client = MongoClient('mongodb://localhost:27017/sport_shop')

db = client['sport_shop']
collection = db['products']
products = list(collection.find())
df_product = pd.DataFrame(products)

# In ra từng sản phẩm
Features = ['description','price']

def combineFeatures(row):
    return str(row['price']) + " " + str(row['description'])

df_product['combinedFeatures'] = df_product.apply(combineFeatures,axis=1)
# print(df_product['combinedFeatures'].head())

tf = TfidfVectorizer()
tfMatrix = tf.fit_transform(df_product['combinedFeatures'])

similar = cosine_similarity(tfMatrix)
number = 6
@app.route('/api', methods=['GET'])
def get_data():
    ket_qua = []
    try:
        productid = request.args.get('id')
        if not productid:
            return jsonify({'loi': 'id khong duoc cung cap'}), 400

        # Chuyển ID từ chuỗi sang ObjectId nếu cần
        productid = ObjectId(productid)

        # Kiểm tra nếu ID tồn tại trong database
        product = collection.find_one({"_id": productid})
        if not product:
            return jsonify({'loi': 'id khong hop le'}), 404

        # Lấy index sản phẩm trong DataFrame
        indexproduct = df_product[df_product['_id'] == productid].index[0]
        similarProduct = list(enumerate(similar[indexproduct]))
        sortedSimilarProduct = sorted(similarProduct, key=lambda x: x[1], reverse=True)

        def lay_id(index):
            return str(df_product[df_product.index == index]['_id'].values[0])  # Chuyển _id thành chuỗi

        for i in range(1, number + 1):
            ket_qua.append(lay_id(sortedSimilarProduct[i][0]))

        print(ket_qua)
        return jsonify({'san pham goi y': ket_qua})

    except Exception as e:
        return jsonify({'loi': str(e)}), 500

if __name__ =='__main__':
    app.run(port=5555)
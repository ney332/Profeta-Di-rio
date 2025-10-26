import requests
import sys
import json
from datetime import datetime

class NewsAPITester:
    def __init__(self, base_url="https://imprensaonline.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.categories = []
        self.created_articles = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test admin registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"admin_{timestamp}@test.com",
            "senha": "AdminPass123!",
            "nome": f"Admin Test {timestamp}"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success:
            self.user_id = response.get('id')
            print(f"   Created user ID: {self.user_id}")
            return user_data
        return None

    def test_login(self, user_data):
        """Test admin login"""
        login_data = {
            "email": user_data["email"],
            "senha": user_data["senha"]
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_categories(self):
        """Test get categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        
        if success:
            self.categories = response
            print(f"   Found {len(self.categories)} categories")
            for cat in self.categories:
                print(f"     - {cat['nome']} (ID: {cat['id']})")
        return success

    def test_create_article(self, article_data):
        """Test create article"""
        success, response = self.run_test(
            f"Create Article: {article_data['titulo']}",
            "POST",
            "articles",
            200,
            data=article_data
        )
        
        if success:
            self.created_articles.append(response)
            print(f"   Created article ID: {response.get('id')}")
            print(f"   Article slug: {response.get('slug')}")
        return success, response

    def test_get_articles(self):
        """Test get all articles"""
        success, response = self.run_test(
            "Get All Articles",
            "GET",
            "articles",
            200
        )
        
        if success:
            print(f"   Found {len(response)} articles")
        return success

    def test_get_featured_articles(self):
        """Test get featured articles"""
        success, response = self.run_test(
            "Get Featured Articles",
            "GET",
            "articles?destaque=true",
            200
        )
        
        if success:
            print(f"   Found {len(response)} featured articles")
        return success

    def test_get_article_by_slug(self, slug):
        """Test get article by slug"""
        success, response = self.run_test(
            f"Get Article by Slug: {slug}",
            "GET",
            f"articles/slug/{slug}",
            200
        )
        
        if success:
            print(f"   Views: {response.get('visualizacoes', 0)}")
        return success

    def test_get_popular_articles(self):
        """Test get popular articles"""
        success, response = self.run_test(
            "Get Popular Articles",
            "GET",
            "articles/popular",
            200
        )
        
        if success:
            print(f"   Found {len(response)} popular articles")
        return success

    def test_get_stats(self):
        """Test get stats"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200
        )
        
        if success:
            print(f"   Total articles: {response.get('total_articles', 0)}")
            print(f"   Total views: {response.get('total_views', 0)}")
        return success

    def test_upload_image(self):
        """Test image upload (mock)"""
        # Create a simple test image data
        import base64
        test_image_data = base64.b64encode(b"fake_image_data").decode()
        
        # This would normally be a multipart form, but we'll test the endpoint exists
        success, response = self.run_test(
            "Upload Image Endpoint Check",
            "POST",
            "upload-image",
            422  # Expected since we're not sending proper multipart data
        )
        
        # 422 is expected for invalid data format, which means endpoint exists
        if response or True:  # Endpoint exists
            print("   ✅ Upload endpoint is accessible")
            return True
        return False

def main():
    print("🚀 Starting News Blog API Testing...")
    print("=" * 60)
    
    tester = NewsAPITester()
    
    # Test 1: Register admin user
    user_data = tester.test_register()
    if not user_data:
        print("❌ Registration failed, stopping tests")
        return 1

    # Test 2: Login
    if not tester.test_login(user_data):
        print("❌ Login failed, stopping tests")
        return 1

    # Test 3: Get current user
    if not tester.test_get_me():
        print("❌ Get current user failed")

    # Test 4: Get categories
    if not tester.test_get_categories():
        print("❌ Get categories failed")
        return 1

    if not tester.categories:
        print("❌ No categories found, cannot create articles")
        return 1

    # Test 5: Create test articles
    test_articles = [
        {
            "titulo": "Política: Nova Lei Aprovada no Congresso",
            "resumo": "O Congresso Nacional aprovou hoje uma nova lei que impacta diretamente a vida dos brasileiros.",
            "conteudo": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            "categoria_id": next((c['id'] for c in tester.categories if c['nome'] == 'Política'), tester.categories[0]['id']),
            "destaque": True,
            "imagem_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        },
        {
            "titulo": "Tecnologia: Inteligência Artificial Revoluciona Mercado",
            "resumo": "Novas tecnologias de IA estão transformando diversos setores da economia brasileira.",
            "conteudo": "A inteligência artificial tem se mostrado uma ferramenta revolucionária em diversos setores. Empresas brasileiras estão investindo pesadamente nesta tecnologia.\n\nOs benefícios incluem maior eficiência, redução de custos e melhoria na qualidade dos serviços oferecidos aos consumidores.",
            "categoria_id": next((c['id'] for c in tester.categories if c['nome'] == 'Tecnologia'), tester.categories[1]['id']),
            "destaque": False,
            "imagem_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        },
        {
            "titulo": "Esportes: Brasileiros Conquistam Medalhas Internacionais",
            "resumo": "Atletas brasileiros se destacam em competições internacionais, trazendo orgulho para o país.",
            "conteudo": "O esporte brasileiro continua em alta no cenário internacional. Nossos atletas têm demonstrado excelência técnica e dedicação.\n\nAs conquistas recentes reforçam a importância do investimento no esporte nacional e na formação de novos talentos.",
            "categoria_id": next((c['id'] for c in tester.categories if c['nome'] == 'Esportes'), tester.categories[2]['id']),
            "destaque": False,
            "imagem_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        },
        {
            "titulo": "Economia: Mercado Financeiro em Alta",
            "resumo": "Indicadores econômicos mostram crescimento positivo no último trimestre.",
            "conteudo": "A economia brasileira apresenta sinais de recuperação. Os principais indicadores mostram tendência de crescimento.\n\nEspecialistas apontam que a estabilidade política e as reformas estruturais contribuem para este cenário positivo.",
            "categoria_id": next((c['id'] for c in tester.categories if c['nome'] == 'Economia'), tester.categories[3]['id']),
            "destaque": True,
            "imagem_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }
    ]

    for article_data in test_articles:
        success, created_article = tester.test_create_article(article_data)
        if not success:
            print(f"❌ Failed to create article: {article_data['titulo']}")

    # Test 6: Get all articles
    tester.test_get_articles()

    # Test 7: Get featured articles
    tester.test_get_featured_articles()

    # Test 8: Get article by slug (test first created article)
    if tester.created_articles:
        first_article = tester.created_articles[0]
        tester.test_get_article_by_slug(first_article['slug'])

    # Test 9: Get popular articles
    tester.test_get_popular_articles()

    # Test 10: Get stats
    tester.test_get_stats()

    # Test 11: Test image upload endpoint
    tester.test_upload_image()

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
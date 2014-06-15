package muv;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.concurrent.Executor;

import com.sun.net.httpserver.*;

/**
 * Hello world!
 *
 */
public class JilWebServer
{
    private HttpServer server;
    private int port;
    private String contextPath;
	
    public JilWebServer(int port, String contextPath) {
		this.port = port;
		this.contextPath = contextPath;
	}
    
	void start() throws IOException {
    	server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext(contextPath, new MyHandler());
        server.setExecutor(null); // creates a default executor
        server.start();
    }
	
    static class MyHandler implements HttpHandler {
        public void handle(HttpExchange t) throws IOException {
            String response = "This is the response";
            t.sendResponseHeaders(200, response.length());
            OutputStream os = t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }
    
    public static void main( String[] args ) throws IOException
    {
    	JilWebServer jilServer = new JilWebServer(8081, "C:\\MUV\\PROG\\git\\JilGraph\\java\\jil-web-server");
    	jilServer.start();
    }
}
